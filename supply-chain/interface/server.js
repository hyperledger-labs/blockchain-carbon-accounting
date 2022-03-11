"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// import router
const router_1 = require("./app/routers/router");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// middleware setting
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use('/', router_1.router);
app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
