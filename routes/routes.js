import express from 'express';
import indexRouter from './index.js';
import authRouter from './auth.js';

export default (app) => {
  app.use(express.json());

  app.use('/', indexRouter);
  app.use('/', authRouter);
};
