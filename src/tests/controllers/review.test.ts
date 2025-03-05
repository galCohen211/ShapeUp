import request from 'supertest';
import jwt from 'jsonwebtoken';

import app, { socketIOServer } from '../../server';
import Review from '../../models/review-model';
import Gym from '../../models/gym-model';
import User, { IUserType } from '../../models/user-model';

jest.mock('../../models/review-model');
jest.mock('../../models/gym-model');
jest.mock('../../models/user-model');

describe('POST /reviews', () => {
  const mockUserToken = jwt.sign({ id: 'mockUserId', role: IUserType.USER }, process.env.JWT_SECRET || 'testsecret');
  const mockAdminToken = jwt.sign({ id: 'mockAdminId', role: IUserType.ADMIN }, process.env.JWT_SECRET || 'testsecret');

  afterAll(async () => {
    socketIOServer.close();
  });

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
    expect(response.body.message).toBe("Your role is not allowed to access this resource");
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
    expect(response.body.message).toBe('Internal server error');
  });
});

jest.mock('../../models/review-model');
jest.mock('../../models/user-model');

describe('PUT /reviews/:reviewId', () => {
  const mockUserToken = jwt.sign({ id: 'mockUserId', role: IUserType.USER }, process.env.JWT_SECRET || 'testsecret');
  const mockAdminToken = jwt.sign({ id: 'mockAdminId', role: IUserType.ADMIN }, process.env.JWT_SECRET || 'testsecret');

  beforeEach(() => {
    jest.clearAllMocks();
  });

    it("should return 200 if the review was deleted successfully", async () => {
      (Review.findByIdAndDelete as jest.Mock).mockResolvedValue({
        id: 'mockReviewId',
        rating: 4,
        content: 'Updated review content',
        user: 'mockUserId',
        gym: 'mockGymId',
      });
      
      const response = await request(app).delete('/reviews/mockReviewId').set('Cookie', [`access_token=${mockUserToken}`]);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Review deleted successfully");
  })

  it('should update a review successfully with valid inputs and token', async () => {
    (Review.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      id: 'mockReviewId',
      rating: 4,
      content: 'Updated review content',
      user: 'mockUserId',
      gym: 'mockGymId',
    });
    (User.findById as jest.Mock).mockResolvedValue({ id: 'mockUserId', name: 'Mock User' });

    const response = await request(app)
      .put('/reviews/mockReviewId')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 4, content: 'Updated review content' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Review updated successfully.');
    expect(Review.findByIdAndUpdate).toHaveBeenCalledWith('mockReviewId', { rating: 4, content: 'Updated review content' }, { new: true });
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .put('/reviews/mockReviewId')
      .send({ rating: 4, content: 'Updated review content' });

    expect(response.status).toBe(401);
  });

  it('should return 400 if rating is invalid (out of range)', async () => {
    const response = await request(app)
      .put('/reviews/mockReviewId')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 6, content: 'Updated review content' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Rating must be between 1 and 5.');
  });

  it('should return 400 if content is empty or only whitespace', async () => {
    const response = await request(app)
      .put('/reviews/mockReviewId')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 4, content: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Content cannot be empty.');
  });

  it('should return 500 for unexpected errors', async () => {
    (Review.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .put('/reviews/mockReviewId')
      .set('Cookie', [`access_token=${mockUserToken}`])
      .send({ rating: 4, content: 'Updated review content' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});

jest.mock('../../models/review-model');
jest.mock('../../models/gym-model');
jest.mock('../../models/user-model');

describe('GET /reviews', () => {
  const mockUserToken = jwt.sign({ id: 'mockUserId', role: IUserType.USER }, process.env.JWT_SECRET || 'testsecret');
  const mockAdminToken = jwt.sign({ id: 'mockAdminId', role: IUserType.ADMIN }, process.env.JWT_SECRET || 'testsecret');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all reviews successfully with valid token', async () => {
    (Review.find as jest.Mock).mockResolvedValue([
      { id: 'mockReviewId1', rating: 5, content: 'Great gym!', user: 'mockUserId', gym: 'mockGymId' },
      { id: 'mockReviewId2', rating: 4, content: 'Nice place', user: 'mockUserId', gym: 'mockGymId' }
    ]);

    const response = await request(app)
      .get('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.reviews).toHaveLength(2);
    expect(response.body.reviews[0].content).toBe('Great gym!');
  });

  it('should return an empty array if there are no reviews', async () => {
    (Review.find as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.reviews).toHaveLength(0);
  });

  it('should return 500 for unexpected errors', async () => {
    (Review.find as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/reviews')
      .set('Cookie', [`access_token=${mockUserToken}`]);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});

describe('GET /reviews/gym/:gymId', () => {
  const mockUserToken = jwt.sign({ id: 'mockUserId', role: IUserType.GYM_OWNER }, process.env.JWT_SECRET || 'testsecret');
  const mockGymId = 'mockGymId';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all reviews for a specific gym successfully with valid token', async () => {
    (Review.find as jest.Mock).mockResolvedValue([
      { id: 'mockReviewId1', rating: 5, content: 'Great gym!', user: 'mockUserId', gym: mockGymId },
      { id: 'mockReviewId2', rating: 4, content: 'Nice place', user: 'mockUserId', gym: mockGymId },
    ]);

    const response = await request(app)
      .get(`/reviews/gym/${mockGymId}`)
      .set('Cookie', [`access_token=${mockUserToken}`]);
    expect(response.status).toBe(200);
    expect(response.body.reviews).toHaveLength(2);
    expect(response.body.reviews[0].content).toBe('Great gym!');
    expect(response.body.reviews[0].gym).toBe(mockGymId);
  });

  it('should return an empty array if there are no reviews for the specified gym', async () => {
    (Review.find as jest.Mock).mockResolvedValue([]);
    const response = await request(app)
      .get(`/reviews/gym/${mockGymId}`)
      .set('Cookie', [`access_token=${mockUserToken}`]);
    expect(response.status).toBe(200);
    expect(response.body.reviews).toHaveLength(0);
  });
 
  it('should return 404 if gymId is missing', async () => {
    const response = await request(app)
      .get(`/reviews/gym/`)   
      .set('Cookie', [`access_token=${mockUserToken}`]);
    expect(response.status).toBe(404);
  });
  
  it('should return 500 for unexpected errors', async () => {
    (Review.find as jest.Mock).mockRejectedValue(new Error('Database error'));
    const response = await request(app)
      .get(`/reviews/gym/${mockGymId}`)
      .set('Cookie', [`access_token=${mockUserToken}`]);
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});



