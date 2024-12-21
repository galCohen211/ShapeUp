import request from 'supertest';
import app from '../../server'; 
import Review from '../../models/review-model';
import Gym from '../../models/gym-model';
import User from '../../models/user-model';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../models/review-model');
jest.mock('../../models/gym-model');
jest.mock('../../models/user-model');

describe('POST /reviews', () => {
  const mockUserToken = jwt.sign({ id: 'mockUserId', type: 'user' }, process.env.JWT_SECRET || 'testsecret');
  const mockAdminToken = jwt.sign({ id: 'mockAdminId', type: 'ADMIN' }, process.env.JWT_SECRET || 'testsecret');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a review successfully with valid inputs and token', async () => {
    (Gym.findById as jest.Mock).mockResolvedValue({ id: 'mockGymId', name: 'Mock Gym' });
    (User.findById as jest.Mock).mockResolvedValue({ id: 'mockUserId', name: 'Mock User' });
    (Review.prototype.save as jest.Mock).mockResolvedValue({
      id: 'mockReviewId',
      rating: 5,
      content: 'Great gym!',
      user: 'mockUserId',
      gym: 'mockGymId',
    });

    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 5, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Review added successfully.');
    expect(Review.prototype.save).toHaveBeenCalledTimes(1);
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .post('/reviews')
      .send({ rating: 5, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(401);
    expect(response.text).toBe('Missing token');
  });

  it('should return 403 if the user role is not authorized', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockAdminToken}`]) // Admin is not allowed for this route
      .send({ rating: 5, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(403);
    expect(response.text).toBe("Forbidden. You don't have access to this resource");
  });

  it('should return 400 for invalid rating', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 6, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Rating must be between 1 and 5.');
  });

  it('should return 404 if gym does not exist', async () => {
    (Gym.findById as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 5, content: 'Great gym!', gym: 'nonexistentGymId' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Gym not found');
  });

  it('should return 404 if user does not exist', async () => {
    (Gym.findById as jest.Mock).mockResolvedValue({ id: 'mockGymId', name: 'Mock Gym' });
    (User.findById as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 5, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should return 500 for unexpected errors', async () => {
    (Gym.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 5, content: 'Great gym!', gym: 'mockGymId' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('An error occurred while adding the review.');
  });
});
