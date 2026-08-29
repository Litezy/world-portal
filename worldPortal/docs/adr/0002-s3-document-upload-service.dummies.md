# ADR for Dummies: 0002 - Cloud File & Document Upload Service (S3)

* **Status:** Approved
* **Date:** 2026-08-27
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations Staff

---

## 1. What problem are we solving?
Users, partners, and staff need to upload passport scans, visa applications, and supporting documents. Storing thousands of high-resolution images and PDFs directly on our app servers would slow down the system and run out of disk space. We need a safe, fast cloud storage system that receives documents and gives back a secure web link (URL).

## 2. What is changing?
* **Direct Cloud Storage:** Uploaded files will be sent straight to AWS S3 cloud storage instead of keeping them on the application server.
* **Instant URL Return:** Once uploaded, the service immediately returns a permanent link (URL) to the document.
* **File Protection & Checks:** The service automatically checks that files are valid documents (PDF, JPEG, PNG, WEBP) and under 10MB before saving them.

## 3. Why are we doing this?
* **Unlimited Capacity:** AWS S3 provides virtually unlimited cloud storage for millions of passport documents.
* **Speed & Reliability:** Files are delivered quickly and backed up safely in the cloud.
* **Clean Records:** Payment and Visa processing workflows can store the returned URL directly in database records.

## 4. How does it work (in simple terms)?
1. A user or staff member selects a document scan (e.g. `passport.pdf`) and clicks Upload in World Portal.
2. The platform verifies the file type and size.
3. The platform uploads `passport.pdf` to our secure cloud bucket.
4. The system returns the web link (e.g., `https://documents.worldportal.com/documents/passport.pdf`) to be saved in the applicant's record.

## 5. What are the key risks or things to watch out for?
* **Cloud Credentials:** Requires valid AWS S3 bucket name and access keys configured in environment settings.
