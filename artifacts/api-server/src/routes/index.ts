import { Router, type IRouter } from "express";
import adminAuthRouter from "./admin-auth";
import healthRouter from "./health";
import productsRouter from "./products";
import aboutRouter from "./about";
import quotesRouter from "./quotes";
import i18nRouter from "./i18n";
import settingsRouter from "./settings";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(productsRouter);
router.use(aboutRouter);
router.use(quotesRouter);
router.use(i18nRouter);
router.use(settingsRouter);
router.use(documentsRouter);

export default router;
