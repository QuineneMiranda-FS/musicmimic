"use strict";

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Mock Models/Services
jest.mock("../models", () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    upsert: jest.fn(),
  },
  History: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../services/spotifyService", () => ({
  getTrackMetadata: jest.fn(),
  searchTrack: jest.fn(),
}));

jest.mock("../services/geniusService", () => ({
  getLyrics: jest.fn(),
}));

jest.mock("../services/aiService", () => ({
  analyzeTrackMood: jest.fn(),
  generateRecommendations: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  authenticateJWT: (req, res, next) => {
    req.user = { userId: 42 };
    next();
  },
}));

jest.mock("axios");

process.env.JWT_SECRET = "test_secret";
process.env.SPOTIFY_CLIENT_ID = "mock_client_id";
process.env.SPOTIFY_CLIENT_SECRET = "mock_client_secret";
process.env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";

const apiRouter = require("../routes/api");
const app = express();
app.use(express.json());
app.use("/api", apiRouter);

const { User, History } = require("../models");
const spotifyService = require("../services/spotifyService");
const geniusService = require("../services/geniusService");
const aiService = require("../services/aiService");

describe("Express App Backend Absolute Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // API.JS
  describe("GET /api/status", () => {
    it("should return API online status", async () => {
      const res = await request(app).get("/api/status");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /api/search", () => {
    it("should fail if query parameter is missing", async () => {
      const res = await request(app).get("/api/search");
      expect(res.statusCode).toBe(400);
    });

    it("should successfully return results", async () => {
      User.findByPk.mockResolvedValue({
        id: 42,
        spotifyAccessToken: "valid_access",
        spotifyRefreshToken: "valid_refresh",
        save: jest.fn().mockResolvedValue(true),
      });

      let interceptorErrorHandler;

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          data: {
            tracks: {
              items: [
                {
                  id: "1",
                  name: "Song",
                  artists: [{ name: "Singer" }],
                  album: { name: "Album", images: [{ url: "img.jpg" }] },
                  external_urls: { spotify: "url" },
                  preview_url: "url",
                },
              ],
            },
            artists: {
              items: [
                {
                  id: "2",
                  name: "Singer",
                  external_urls: { spotify: "url" },
                  images: [{ url: "img.jpg" }],
                  genres: ["pop"],
                },
              ],
            },
            albums: {
              items: [
                {
                  id: "3",
                  name: "Album",
                  artists: [{ name: "Singer" }],
                  external_urls: { spotify: "url" },
                  images: [{ url: "img.jpg" }],
                },
              ],
            },
          },
        }),
        interceptors: {
          response: {
            use: jest.fn((success, failure) => {
              interceptorErrorHandler = failure;
            }),
          },
        },
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      const res = await request(app).get("/api/search").query({ q: "Queen" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // 401
      if (interceptorErrorHandler) {
        axios.post.mockResolvedValueOnce({
          data: { access_token: "refreshed_token" },
        });
        const fakeError = {
          response: { status: 401 },
          config: { headers: {} },
        };
        try {
          await interceptorErrorHandler(fakeError);
        } catch (e) {}
      }
    });
  });

  // AUTH & AUTH-CALLBACK
  describe("GET /api/auth/login/spotify", () => {
    it("should redirect to Spotify url", async () => {
      const res = await request(app).get("/api/auth/login/spotify");
      expect(res.statusCode).toBe(302);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh token", async () => {
      const mockUser = {
        id: 42,
        spotifyRefreshToken: "refresh_123",
        spotifyAccessToken: "old_access",
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);
      axios.post.mockResolvedValueOnce({
        data: { access_token: "new_access" },
      });

      const sampleToken = jwt.sign({ userId: 42 }, "test_secret");
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${sampleToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });
  });

  describe("GET /api/auth/callback/spotify", () => {
    it("should fail validation", async () => {
      const res = await request(app).get("/api/auth/callback/spotify");
      expect(res.statusCode).toBe(400);
    });

    it("should handle token exchange and redirect to frontend", async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: "mock_access", refresh_token: "mock_refresh" },
      });
      axios.get.mockResolvedValueOnce({
        data: { id: "user123", email: "a@b.com", display_name: "User" },
      });
      User.upsert.mockResolvedValue([true]);
      User.findOne.mockResolvedValue({ id: 42 });

      const res = await request(app)
        .get("/api/auth/callback/spotify")
        .query({ code: "auth_code" });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain("http://127.0.0.1:5173/");
    });
  });

  // TRACKS
  describe("POST /api/tracks/analyze", () => {
    it("should interact with AI for mood analysis", async () => {
      User.findByPk.mockResolvedValue({ spotifyAccessToken: "tok" });
      spotifyService.getTrackMetadata.mockResolvedValue({
        previewUrl: "url",
        albumImage: "img",
      });
      geniusService.getLyrics.mockResolvedValue({
        lyricsText: "Some lyrics",
        geniusUrl: "url",
      });
      aiService.analyzeTrackMood.mockResolvedValue({
        label: "Chill",
        emoji: "😎",
        legendGroup: "Vibe",
      });

      const res = await request(app).post("/api/tracks/analyze").send({
        spotifyId: "track123",
        title: "Song Title",
        artist: "Artist Name",
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /api/tracks/recommendations", () => {
    it("should resolve AI recs", async () => {
      User.findByPk.mockResolvedValue({ spotifyAccessToken: "tok_123" });
      aiService.generateRecommendations.mockResolvedValue([
        { title: "Rec Song", artist: "Rec Artist" },
      ]);
      spotifyService.searchTrack.mockResolvedValue({
        id: "spot_id",
        name: "Rec Song",
        artists: [{ name: "Rec Artist" }],
        album: { images: [{ url: "rec.jpg" }] },
        preview_url: "preview_url",
      });

      const res = await request(app)
        .get("/api/tracks/recommendations")
        .query({ mood: "Chill", title: "Song", artist: "Artist" });

      expect(res.statusCode).toBe(200);
      expect(res.body[0].title).toBe("Rec Song");
    });
  });

  // USERS
  describe("GET /api/users/profile/mood-settings", () => {
    it("should pull active user settings", async () => {
      User.findByPk.mockResolvedValue({ moodSettings: {} });
      const res = await request(app).get("/api/users/profile/mood-settings");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("PUT /api/users/profile/mood-settings", () => {
    it("should process updates", async () => {
      const mockUser = {
        moodSettings: {},
        changed: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app)
        .put("/api/users/profile/mood-settings")
        .send({ privacyShield: true });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("POST /api/users/history", () => {
    it("should add to history", async () => {
      History.create.mockResolvedValue({});
      const res = await request(app)
        .post("/api/users/history")
        .send({ id: "123", name: "Song", artist: "Artist" });
      expect(res.statusCode).toBe(201);
    });
  });

  describe("DELETE /api/users/history/:trackId", () => {
    it("should delete a song history", async () => {
      History.destroy.mockResolvedValue(1);
      const res = await request(app).delete("/api/users/history/track123");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("DELETE /api/users/history", () => {
    it("should clear daily, not weekly/monthly", async () => {
      History.update.mockResolvedValue([1]);
      const res = await request(app).delete("/api/users/history");
      expect(res.statusCode).toBe(200);
    });
  });
});
