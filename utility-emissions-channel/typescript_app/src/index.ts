import { config } from "dotenv";
import App from "./app";

config();

const app = new App();
app.start();
