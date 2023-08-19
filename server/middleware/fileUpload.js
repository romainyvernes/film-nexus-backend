import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { baseSchema } from "../validation/schemas/File";
import * as Member from "../models/Member";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
});

const bucket = process.env.AWS_BUCKET;

export const uploadFile = multer({
  storage: multerS3({
    s3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      const fileKey = Date.now().toString();
      cb(null, fileKey);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // in bytes, limit file size to 10MB
  },
  fileFilter: function (req, file, cb) {
    if (process.env.NODE_ENV === "test") {
      req.file = {
        position: "https://filmnexus.s3.us-west-2.amazonaws.com/test.docx",
        originalName: "test.docx",
      };
      cb(null, false);
    } else {
      cb(null, true);
    }
  }
});

export const handleFileUpload = [
  // basic validation before uploading file to S3
  async (req, res, next) => {
    const { error, value } = baseSchema
      .fork(["url", "name"], (schema) => schema.optional())
      .validate(
        {
          projectId: req.params.id,
          creatorId: req.userId,
        },
        { allowUnknown: true }
      );

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      projectId,
      creatorId,
    } = value;

    try {
      const accessor = await Member.getMember(projectId, creatorId);
      if (!accessor) {
        return res.status(401).json({ File: "Access denied" });
      }
      next();
    } catch(error) {
      res.status(error.status || 500).json({ message: error.message || 'Error uploading File' });
    }
  },
  // NOTE: same fieldName "file" must be passed in by client to avoid errors
  uploadFile.single("file")
];

export const deleteFileFromS3 = (fileKey) => {
  return s3.deleteObject({
    Bucket: bucket,
    Key: fileKey
  });
};
