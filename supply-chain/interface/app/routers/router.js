"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const controller_1 = require("../controllers/controller");
const router = express_1.default.Router();
exports.router = router;
const upload = (0, multer_1.default)({ dest: './keys' });
router
    .route('/issue')
    .post(upload.fields([{
        name: 'keys'
    }, {
        name: 'input'
    }]), controller_1.issueToken);
