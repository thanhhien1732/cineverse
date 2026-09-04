import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/modules/modules-system/prisma/prisma.service';
import { buildSeatLockKey, SEAT_HOLD_MINUTES } from 'src/common/helpers/seat-lock.helper';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FindAllBookingDto } from './dto/find-all-booking.dto';

/** Mã lỗi Prisma khi một UNIQUE INDEX bị vi phạm. */
const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) { }

  // ------------------ CREATE ------------------
  async create(userId: number, dto: CreateBookingDto) {
    const bookingExist = await this.prisma.bookings.findFirst({
      where: {
        showtimeId: dto.showtimeId,
        seatId: dto.seatId,
        isBooked: true,
        paymentStatus: { in: ['PENDING', 'PAID'] },
      },
    });

    if (bookingExist) throw new BadRequestException('This seat is already booked for this showtime!');

    const showtime = await this.prisma.showtimes.findUnique({
      where: { showtimeId: dto.showtimeId },
    });

    const seat = await this.prisma.seats.findUnique({
      where: { seatId: dto.seatId },
      include: { SeatTypes: true },
    });

    if (!showtime || !seat) throw new NotFoundException('Invalid showtime or seat ID!');

    const seatMultiplier = Number(seat.SeatTypes?.multiplier ?? 1);
    const seatPrice = Math.round(Number(showtime.basePrice) * seatMultiplier);

    // Kiểm tra ở trên chỉ để trả lỗi thân thiện. Chốt chặn thật nằm ở UNIQUE
    // INDEX của cột `bookingSlot`: hai request đồng thời cùng vượt qua bước
    // kiểm tra thì CSDL vẫn chỉ cho đúng một request ghi được ghế.
    const booking = await this.createWithSeatLock({
      userId,
      showtimeId: dto.showtimeId,
      seatId: dto.seatId,
      seatPrice,
    });

    return {
      bookingId: booking.bookingId,
      userName: booking.Users?.fullName ?? null,
      movieName: booking.Showtimes.Movies?.movieName ?? null,
      cinemaName: booking.Showtimes.Cinemas?.cinemaName ?? null,
      cinemaAddress: booking.Showtimes.Cinemas?.address ?? null,
      roomName: booking.Showtimes.Rooms?.roomName ?? null,
      seatName: booking.Seats?.seatName ?? null,
      seatType: booking.Seats?.SeatTypes?.seatTypeName ?? null,
      showDate: booking.Showtimes?.showDate,
      showTimeStart: booking.Showtimes?.showTimeStart,
      showTimeEnd: booking.Showtimes?.showTimeEnd,
      durationMinutes: booking.Showtimes?.durationMinutes,
      seatPrice: booking.seatPrice,
      paymentStatus: booking.paymentStatus,
      isBooked: booking.isBooked,
      bookingDateTime: booking.bookingDateTime,
      holdExpiresAt: booking.bookingDateTime
        ? new Date(booking.bookingDateTime.getTime() + SEAT_HOLD_MINUTES * 60_000)
        : null,
    };
  }

  /**
   * Ghi booking và để UNIQUE INDEX `uq_bookings_slot` làm trọng tài khi nhiều
   * người cùng chọn một ghế. Request thua cuộc nhận 409 thay vì tạo vé trùng.
   */
  private async createWithSeatLock(input: {
    userId: number;
    showtimeId: number;
    seatId: number;
    seatPrice: number;
  }) {
    try {
      return await this.prisma.bookings.create({
        data: {
          userId: input.userId,
          showtimeId: input.showtimeId,
          seatId: input.seatId,
          seatPrice: input.seatPrice,
          isBooked: true,
          paymentStatus: 'PENDING',
          bookingDateTime: new Date(),
          bookingSlot: buildSeatLockKey(input.showtimeId, input.seatId),
        },
        include: {
          Users: { select: { fullName: true, email: true } },
          Showtimes: {
            select: {
              Movies: { select: { movieName: true } },
              Cinemas: { select: { cinemaName: true, address: true } },
              Rooms: { select: { roomName: true } },
              showDate: true,
              showTimeStart: true,
              showTimeEnd: true,
              durationMinutes: true,
            },
          },
          Seats: {
            select: {
              seatName: true,
              SeatTypes: { select: { seatTypeName: true } }
            },
          },
        },
      });
    } catch (error) {
      const isSeatTaken =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION;

      if (isSeatTaken) {
        throw new ConflictException(
          'Ghế này vừa được người khác giữ. Vui lòng chọn ghế khác!',
        );
      }

      throw error;
    }
  }

  // ------------------ SEAT MAP ------------------
  /**
   * Trạng thái từng ghế của một suất chiếu để client vẽ sơ đồ ghế theo thời
   * gian thực: ghế người khác đang giữ sẽ bị khoá ngay trên giao diện thay vì
   * để người dùng chọn rồi mới báo lỗi lúc thanh toán.
   */
  async getSeatMap(showtimeId: number, userId?: number) {
    const showtime = await this.prisma.showtimes.findUnique({
      where: { showtimeId },
    });

    if (!showtime) throw new NotFoundException('Showtime not found!');

    const [seats, activeBookings] = await Promise.all([
      this.prisma.seats.findMany({
        where: { isDeleted: false },
        select: {
          seatId: true,
          seatName: true,
          rowLabel: true,
          columnIndex: true,
          SeatTypes: { select: { seatTypeName: true } },
        },
        orderBy: [{ rowLabel: 'asc' }, { columnIndex: 'asc' }],
      }),
      this.prisma.bookings.findMany({
        where: { showtimeId, bookingSlot: { not: null } },
        select: {
          seatId: true,
          userId: true,
          paymentStatus: true,
          bookingDateTime: true,
        },
      }),
    ]);

    const bookingBySeatId = new Map(
      activeBookings.map((booking) => [booking.seatId, booking]),
    );

    return {
      showtimeId,
      holdMinutes: SEAT_HOLD_MINUTES,
      seats: seats.map((seat) => {
        const booking = bookingBySeatId.get(seat.seatId);
        const status = !booking
          ? 'AVAILABLE'
          : booking.paymentStatus === 'PAID'
            ? 'BOOKED'
            : 'HELD';

        return {
          seatId: seat.seatId,
          seatName: seat.seatName,
          rowLabel: seat.rowLabel,
          columnIndex: seat.columnIndex,
          seatType: seat.SeatTypes?.seatTypeName ?? null,
          status,
          /** Ghế do chính người đang xem giữ thì vẫn cho phép thao tác tiếp. */
          heldByMe: Boolean(booking && userId && booking.userId === userId),
          holdExpiresAt:
            status === 'HELD' && booking?.bookingDateTime
              ? new Date(
                booking.bookingDateTime.getTime() + SEAT_HOLD_MINUTES * 60_000,
              )
              : null,
        };
      }),
    };
  }

  // ------------------ FIND ALL ------------------
  async findAll(query: FindAllBookingDto) {
    const { page, pageSize, userId, showtimeId, paymentStatus } = query;

    const where = {
      ...(userId ? { userId: Number(userId) } : {}),
      ...(showtimeId ? { showtimeId: Number(showtimeId) } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    };

    const hasPagination = page && pageSize;
    const skip = hasPagination ? (page - 1) * pageSize : undefined;
    const take = hasPagination ? Number(pageSize) : undefined;

    const [items, totalItem] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        skip,
        take,
        include: {
          Users: { select: { fullName: true } },
          Showtimes: {
            select: {
              Movies: { select: { movieName: true } },
              Cinemas: { select: { cinemaName: true, address: true } },
              Rooms: { select: { roomName: true } },
              showDate: true,
              showTimeStart: true,
              showTimeEnd: true,
              durationMinutes: true,
            },
          },
          Seats: {
            select: {
              seatName: true,
              SeatTypes: { select: { seatTypeName: true } }
            },
          },
        },
        orderBy: { bookingId: 'desc' },
      }),
      this.prisma.bookings.count({ where }),
    ]);

    return {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || totalItem,
      totalItem,
      totalPage: hasPagination ? Math.ceil(totalItem / Number(pageSize)) : 1,
      items: items.map(i => ({
        bookingId: i.bookingId,
        userName: i.Users?.fullName ?? null,
        movieName: i.Showtimes.Movies?.movieName ?? null,
        cinemaName: i.Showtimes.Cinemas?.cinemaName ?? null,
        cinemaAddress: i.Showtimes.Cinemas?.address ?? null,
        roomName: i.Showtimes.Rooms?.roomName ?? null,
        seatName: i.Seats?.seatName ?? null,
        seatType: i.Seats.SeatTypes?.seatTypeName ?? null,
        showDate: i.Showtimes?.showDate ?? null,
        showTimeStart: i.Showtimes?.showTimeStart ?? null,
        showTimeEnd: i.Showtimes?.showTimeStart,
        durationMinutes: i.Showtimes?.durationMinutes,
        seatPrice: i.seatPrice,
        paymentStatus: i.paymentStatus,
        isBooked: i.isBooked,
        bookingDateTime: i.bookingDateTime,
      })),
    };
  }

  // ------------------ FIND ONE ------------------
  async findOne(id: number) {
    const bookingExist = await this.prisma.bookings.findUnique({
      where: { bookingId: id },
      include: {
        Users: { select: { fullName: true, email: true } },
        Showtimes: {
          select: {
            Movies: { select: { movieName: true } },
            Cinemas: { select: { cinemaName: true, address: true } },
            Rooms: { select: { roomName: true } },
            showDate: true,
            showTimeStart: true,
            showTimeEnd: true,
            durationMinutes: true,
          },
        },
        Seats: {
          select: {
            seatName: true,
            SeatTypes: { select: { seatTypeName: true } }
          },
        },
      },
    });

    if (!bookingExist) throw new NotFoundException('Booking not found!');

    return {
      bookingId: bookingExist.bookingId,
      userName: bookingExist.Users?.fullName ?? null,
      movieName: bookingExist.Showtimes.Movies?.movieName ?? null,
      cinemaName: bookingExist.Showtimes.Cinemas?.cinemaName ?? null,
      cinemaAddress: bookingExist.Showtimes.Cinemas?.address ?? null,
      roomName: bookingExist.Showtimes.Rooms?.roomName ?? null,
      seatName: bookingExist.Seats?.seatName ?? null,
      seatType: bookingExist.Seats.SeatTypes?.seatTypeName ?? null,
      showDate: bookingExist.Showtimes?.showDate ?? null,
      showTimeStart: bookingExist.Showtimes?.showTimeStart ?? null,
      showTimeEnd: bookingExist.Showtimes?.showTimeStart,
      durationMinutes: bookingExist.Showtimes?.durationMinutes,
      seatPrice: bookingExist.seatPrice,
      paymentStatus: bookingExist.paymentStatus,
      isBooked: bookingExist.isBooked,
      bookingDateTime: bookingExist.bookingDateTime,
    };
  }

  // ------------------ CANCEL ------------------
  async cancel(id: number) {
    const bookingExist = await this.prisma.bookings.findUnique({
      where: { bookingId: id },
    });

    if (!bookingExist) throw new NotFoundException('Booking not found!');

    if (!bookingExist.isBooked)
      throw new BadRequestException('This booking has already been canceled!');

    if (bookingExist.paymentStatus === 'PAID')
      throw new BadRequestException('Cannot cancel a paid booking!');

    const canceled = await this.prisma.bookings.update({
      where: { bookingId: id },
      data: {
        isBooked: false,
        paymentStatus: 'CANCELED',
        bookingDateTime: null,
        // Nhả khoá ghế để người khác đặt lại được.
        bookingSlot: null,
      },
      include: {
        Users: { select: { fullName: true } },
        Showtimes: {
          select: {
            Movies: { select: { movieName: true } },
            Cinemas: { select: { cinemaName: true, address: true } },
            Rooms: { select: { roomName: true } },
            showDate: true,
            showTimeStart: true,
            showTimeEnd: true,
            durationMinutes: true,
          },
        },
        Seats: {
          select: {
            seatName: true,
            SeatTypes: { select: { seatTypeName: true } }
          },
        },
      },
    });

    return {
      bookingId: canceled.bookingId,
      userName: canceled.Users?.fullName ?? null,
      movieName: canceled.Showtimes.Movies?.movieName ?? null,
      cinemaName: canceled.Showtimes.Cinemas?.cinemaName ?? null,
      cinemaAddress: canceled.Showtimes.Cinemas?.address ?? null,
      roomName: canceled.Showtimes.Rooms?.roomName ?? null,
      seatName: canceled.Seats?.seatName ?? null,
      seatType: canceled.Seats.SeatTypes?.seatTypeName ?? null,
      showDate: canceled.Showtimes?.showDate ?? null,
      showTimeStart: canceled.Showtimes?.showTimeStart ?? null,
      showTimeEnd: canceled.Showtimes?.showTimeStart,
      durationMinutes: canceled.Showtimes?.durationMinutes,
      seatPrice: canceled.seatPrice,
      paymentStatus: canceled.paymentStatus,
      isBooked: canceled.isBooked,
      bookingDateTime: canceled.bookingDateTime,
    };
  }
}
