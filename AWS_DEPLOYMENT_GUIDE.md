# 🚀 TaskMaster - AWS Deployment Guide

## AWS Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          AWS Cloud                           │
├─────────────────────────────────────────────────────────────┤
│  Route 53 (DNS) → CloudFront (CDN) → ALB (Load Balancer)   │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   S3/EC2     │      │     EC2      │    │   MongoDB   │ │
│  │   Frontend   │◄────►│   Backend    │◄──►│   Atlas     │ │
│  │   (React)    │      │  (Node.js)   │    │  (Cloud DB) │ │
│  └──────────────┘      └──────────────┘    └─────────────┘ │
│                              │                               │
│                              ▼                               │
│                         S3 Bucket                            │
│                      (File Uploads)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- [ ] AWS Account (free tier available)
- [ ] AWS CLI installed
- [ ] MongoDB Atlas account (free tier)
- [ ] Domain name (optional, but recommended)

---

## 🎯 Deployment Options

### **Option 1: AWS Elastic Beanstalk** (Easiest - Recommended for Beginners)
- ✅ Automatic scaling
- ✅ Load balancing
- ✅ Health monitoring
- ✅ Easy deployment

### **Option 2: AWS EC2 + Docker** (Full Control)
- ✅ Complete customization
- ✅ Docker support
- ✅ Cost-effective

### **Option 3: AWS Amplify + Lambda** (Serverless)
- ✅ Frontend hosting
- ✅ Serverless backend
- ✅ Auto-scaling

---

## 🚀 OPTION 1: AWS Elastic Beanstalk Deployment

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create a cluster** (Free M0 tier)
3. **Create database user** with password
4. **Whitelist IP**: Add `0.0.0.0/0` (all IPs) for testing
5. **Get connection string**: `mongodb+srv://username:password@cluster.mongodb.net/taskmaster`

### Step 2: Prepare Backend for Deployment

Update `server/.env.production`:
```env
PORT=8080
MONGO_URI=mongodb+srv://username:password@yourcluster.mongodb.net/taskmaster
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

### Step 3: Install AWS CLI & EB CLI

```powershell
# Install AWS CLI
choco install awscli

# Install Elastic Beanstalk CLI
pip install awsebcli

# Configure AWS credentials
aws configure
```

### Step 4: Initialize Elastic Beanstalk

```powershell
cd server
eb init -p node.js taskmaster-backend --region us-east-1
```

### Step 5: Create Environment & Deploy Backend

```powershell
# Create environment
eb create taskmaster-prod-env

# Deploy
eb deploy

# Get URL
eb status
```

### Step 6: Deploy Frontend to S3 + CloudFront

```powershell
# Build React app
cd ..\client
npm run build

# Create S3 bucket
aws s3 mb s3://taskmaster-frontend-yourname

# Upload build files
aws s3 sync build/ s3://taskmaster-frontend-yourname --acl public-read

# Enable static website hosting
aws s3 website s3://taskmaster-frontend-yourname --index-document index.html
```

### Step 7: Update Frontend API URL

Update `client/.env.production`:
```env
REACT_APP_API_URL=http://your-eb-url.elasticbeanstalk.com
REACT_APP_SOCKET_URL=http://your-eb-url.elasticbeanstalk.com
```

---

## 🚀 OPTION 2: AWS EC2 Deployment (Docker)

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2
2. Launch Instance:
   - **AMI**: Amazon Linux 2 or Ubuntu 22.04
   - **Instance Type**: t2.small (free tier eligible)
   - **Security Group**: 
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (5000) - 0.0.0.0/0
     - Custom TCP (3000) - 0.0.0.0/0

### Step 2: Connect to EC2 & Install Docker

```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Your App

```bash
# Clone/Upload your project
git clone your-repo-url
cd TaskMaster

# Create .env file
nano server/.env
# Add your MongoDB Atlas connection string

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Configure Nginx (Reverse Proxy)

```bash
sudo yum install nginx -y
sudo nano /etc/nginx/conf.d/taskmaster.conf
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo service nginx start
```

---

## 🚀 OPTION 3: AWS Amplify (Frontend) + Lambda (Backend)

### Step 1: Deploy Frontend to AWS Amplify

```powershell
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure
amplify configure

# Initialize
cd client
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Step 2: Deploy Backend to AWS Lambda

This requires converting Express to Lambda functions. Alternative: Use API Gateway + Lambda.

---

## 🔧 Production Configuration Files

### Create `server/ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'taskmaster-backend',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

### Update `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    restart: always

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

---

## 📊 AWS Services Cost Estimate

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **MongoDB Atlas** | 512MB (Forever Free) | $0.08/hr (~$57/mo) |
| **EC2 t2.micro** | 750hrs/month (12 months) | $8.35/month |
| **S3 Storage** | 5GB (12 months) | $0.023/GB/month |
| **Elastic Beanstalk** | Free (pay for resources) | Based on EC2/RDS |
| **CloudFront** | 50GB transfer (12 months) | $0.085/GB |

**Estimated Total**: **$0-15/month** (within free tier)

---

## ✅ Post-Deployment Checklist

- [ ] MongoDB Atlas cluster created & connected
- [ ] Environment variables set in production
- [ ] SSL/HTTPS enabled (use AWS Certificate Manager)
- [ ] Domain name configured
- [ ] CORS configured for production domain
- [ ] File upload S3 bucket created
- [ ] Monitoring & logging enabled (CloudWatch)
- [ ] Backup strategy for database
- [ ] Security groups properly configured
- [ ] Auto-scaling configured
- [ ] Health checks enabled

---

## 🔐 Security Best Practices

1. **Use HTTPS** - Get free SSL from AWS Certificate Manager
2. **Environment Variables** - Never commit secrets
3. **MongoDB** - Use strong passwords, whitelist IPs
4. **JWT Secret** - Use strong random string (32+ chars)
5. **CORS** - Restrict to your domain only
6. **Rate Limiting** - Add express-rate-limit
7. **Input Validation** - Validate all user inputs
8. **File Upload** - Limit file sizes, validate types

---

## 🐛 Common AWS Deployment Issues

### Issue: "Cannot connect to MongoDB"
**Solution**: Check MongoDB Atlas IP whitelist, verify connection string

### Issue: "CORS Error"
**Solution**: Update CORS origin in `server/index.js` to your frontend URL

### Issue: "Socket.IO not connecting"
**Solution**: Configure sticky sessions in load balancer, or use Redis adapter

### Issue: "File uploads fail"
**Solution**: Consider using S3 for file storage instead of local disk

---

## 📈 Monitoring & Logs

```bash
# View backend logs (EB)
eb logs

# View Docker logs
docker-compose logs -f backend

# AWS CloudWatch
aws logs tail /aws/elasticbeanstalk/taskmaster-prod-env/var/log/nodejs/nodejs.log
```

---

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend to EB
        run: |
          pip install awsebcli
          eb deploy taskmaster-prod-env
        
      - name: Build & Deploy Frontend to S3
        run: |
          cd client
          npm install
          npm run build
          aws s3 sync build/ s3://taskmaster-frontend
```

---

## 🎓 What You'll Learn

- ✅ Cloud deployment strategies
- ✅ AWS services (EC2, S3, EB, CloudFront)
- ✅ Production environment configuration
- ✅ SSL/HTTPS setup
- ✅ Load balancing & auto-scaling
- ✅ Cloud database management
- ✅ CI/CD pipelines
- ✅ Monitoring & logging

---

## 🚀 Quick Start Commands

### Deploy to EC2:
```bash
# 1. SSH to EC2
ssh -i key.pem ec2-user@your-ip

# 2. Clone & run
git clone your-repo
cd TaskMaster
docker-compose up -d
```

### Deploy to Elastic Beanstalk:
```bash
cd server
eb init
eb create
eb deploy
```

---

**🎉 Your app is production-ready with all features working!**

Need help with deployment? Follow the step-by-step guide above!
