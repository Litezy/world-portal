# ADR 0005 for Dummies: Switching Document Uploads Between AWS S3 and Cloudinary

## 1. What Problem Are We Solving?
Previously, our document upload system was locked only to Amazon AWS S3. If an organization prefers to store documents on **Cloudinary** (or use Cloudinary for media processing and cost efficiency), we could not switch without rewriting code.

## 2. Why Are We Doing This?
By building a **Pluggable Storage Provider System**:
* We can switch between **Cloudinary** and **AWS S3** simply by changing a single setting in our configuration file (`STORAGE_PROVIDER=cloudinary` vs `STORAGE_PROVIDER=s3`).
* Developers can easily test uploads locally without needing live cloud accounts.
* Document upload APIs remain identical for mobile apps and frontend web applications.

## 3. How Does It Work in Simple Terms?
1. **Setting the Storage Provider:** You choose your active provider in `.env`:
   - `STORAGE_PROVIDER=s3` for AWS S3
   - `STORAGE_PROVIDER=cloudinary` for Cloudinary
2. **Uploading a File:** When a passport or proof of funds document is uploaded, the system checks the configuration and automatically routes the file to either AWS S3 or Cloudinary.
3. **Getting the Link:** The system returns a secure HTTPS URL to the uploaded document, regardless of which cloud service stored it.

## 4. Key Business Benefits & Risks
* **Benefit:** Freedom to choose storage providers, lower operational costs, and zero application downtime when switching services.
* **Risk:** Invalid API keys for Cloudinary or S3 (handled with graceful dev fallback and clear logging).
