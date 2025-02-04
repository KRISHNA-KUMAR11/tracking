import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const multerOptions: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
      return cb(
        new BadRequestException('Only image files and PDFs are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
};

export const multerOptionsForJson: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!file.originalname.match(/\.(csv|json)$/)) {
      return cb(
        new BadRequestException('Only CSV and JSON files are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
};
