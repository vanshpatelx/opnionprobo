import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

// Events Managment
app.get('/events', (req : Request, res : Response) => {
  // get All events
});
app.get('/events/:id', (req : Request, res : Response) => {
  // get event
});
app.post('/events', (req : Request, res : Response) => {
  // add event
});
// User Managment
app.post('/register', (req : Request, res : Response) => {
    // register User
});
app.post('/login', (req : Request, res : Response) => {
  // login User
});
// middleware auth
// Order Managment
app.post('/order', (req : Request, res : Response) => {
  // place order
});
app.get('/getOrderBook', (req : Request, res : Response) => {
  // place order
});
app.post('/order', (req : Request, res : Response) => {
  // place order
});


// for dev purpose
// reset
// adding categories


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
