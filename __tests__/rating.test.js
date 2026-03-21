// Mock de Prisma (ANTES de importar la app)
const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {},
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de auth (simula usuario autenticado)
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

// Importar app DESPUÉS de los mocks
const request = require('supertest');
const app = require('../server');

describe('PATCH /api/movies/:id/rating', () => {
    afterEach(() => {
    jest.clearAllMocks();
  });

  // Camino feliz: actualizar rating
  it('debe actualizar el rating de una película', async () => {
    const movie = {
      id: 'movie-1',
      title: 'Inception',
      rating: 0,
      ownerId: 'user-123',
    };

    mockPrisma.movie.findFirst.mockResolvedValue(movie);
    mockPrisma.movie.update.mockResolvedValue({ ...movie, rating: 4 });

    const res = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 4 });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
  });

  // Error: rating mayor que 5
  it('debe devolver 400 si el rating es mayor que 5', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 6 });
    expect(res.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });

  // Error: rating negativo
  it('debe devolver 400 si el rating es negativo', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: -1 });

    expect(res.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();

  });

  // Error: sin rating en el body
  it('debe devolver 400 si no se envía rating', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({});

    expect(res.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });

  // Error: película no encontrada
  it('debe devolver 404 si la película no existe', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/movies/no-existe/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 3 });

    expect(res.status).toBe(404);
  });

  // Error: fallo del servidor
  it('debe devolver 500 si hay un error del servidor', async () => {
    mockPrisma.movie.findFirst.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 3 });

    expect(res.status).toBe(500);
  });
});
