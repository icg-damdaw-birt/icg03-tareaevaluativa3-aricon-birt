// Mock de Prisma (ANTES de importar la app)
const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
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

describe('PATCH /api/movies/:id/favorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Camino feliz: marcar como favorita
  it('debe marcar una película como favorita', async () => {
    const movie = {
      id: 'movie-1',
      title: 'Inception',
      isFavorite: false,
      ownerId: 'user-123',
    };

    mockPrisma.movie.findFirst.mockResolvedValue(movie);
    mockPrisma.movie.update.mockResolvedValue({ ...movie, isFavorite: true });

    const res = await request(app)
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(true);
  });

  // Camino feliz: desmarcar favorita
  it('debe desmarcar una película favorita', async () => {
    const movie = {
      id: 'movie-1',
      title: 'Inception',
      isFavorite: true,
      ownerId: 'user-123',
    };

    mockPrisma.movie.findFirst.mockResolvedValue(movie);
    mockPrisma.movie.update.mockResolvedValue({ ...movie, isFavorite: false });

    const res = await request(app)
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(false);
  });

  // Error: película no encontrada
  it('debe devolver 404 si la película no existe', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/movies/no-existe/favorite')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Película no encontrada');
  });

  // Error: fallo del servidor
  it('debe devolver 500 si hay un error del servidor', async () => {
    mockPrisma.movie.findFirst.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(500);
  });
});
