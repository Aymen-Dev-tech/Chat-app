import express from 'express';
import indexRouter from './index.js';
import authRouter from './auth.js';
import chatRouter from './chat.js'

export default (app) => {
  app.use(express.json());

  app.use('/', indexRouter);
  app.use('/', authRouter);
  app.use('/chat', chatRouter)
};
