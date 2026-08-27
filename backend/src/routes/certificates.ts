import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CertificateService } from '../services/certificate.service';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const issueCertificateSchema = z.object({
  programId: z.string(),
  traineeId: z.string(),
  pdfUrl: z.string().optional(),
  metadata: z.any().optional(),
});

/**
 * GET /api/certificates/verify/:query
 * Public verification endpoint (Can be accessed by employers/government)
 */
router.get('/verify/:query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.params.query as string;
    const result = await CertificateService.verifyCertificate(query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/certificates/issue
 * Admin/Trainer issues certificate to completed trainee
 */
router.post(
  '/issue',
  requireAuth,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN, Role.TRAINER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = issueCertificateSchema.parse(req.body);
      const certificate = await CertificateService.issueCertificate(validated);
      res.status(201).json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/certificates/my-certificates
 * Trainee retrieves their issued certificates
 */
router.get(
  '/my-certificates',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const certificates = await CertificateService.getUserCertificates(req.user!.id);
      res.status(200).json({ success: true, data: certificates });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
