# 🚀 TaskMaster AWS Deployment Checklist

## Pre-Deployment

- [ ] **MongoDB Atlas Setup**
  - [ ] Create free cluster at mongodb.com/cloud/atlas
  - [ ] Create database user with password
  - [ ] Whitelist IP addresses (0.0.0.0/0 for testing)
  - [ ] Copy connection string

- [ ] **AWS Account Setup**
  - [ ] Create AWS account (free tier available)
  - [ ] Set up IAM user with appropriate permissions
  - [ ] Generate access keys

- [ ] **Code Preparation**
  - [ ] Update `server/.env.production` with MongoDB connection
  - [ ] Update `client/.env.production` with backend URL
  - [ ] Test app locally one more time
  - [ ] Commit all changes to Git

---

## Deployment Steps

### Option A: AWS Elastic Beanstalk (Recommended)

- [ ] **Install AWS CLI & EB CLI**
  ```powershell
  choco install awscli
  pip install awsebcli
  aws configure
  ```

- [ ] **Deploy Backend**
  ```powershell
  cd server
  eb init -p node.js taskmaster-backend --region us-east-1
  eb create taskmaster-prod-env
  eb setenv MONGO_URI="your-connection-string" JWT_SECRET="your-secret"
  eb deploy
  ```

- [ ] **Get Backend URL**
  ```powershell
  eb status
  # Note: Copy the CNAME URL (e.g., taskmaster-prod.elasticbeanstalk.com)
  ```

- [ ] **Update Frontend Config**
  - Update `client/.env.production` with backend URL
  ```env
  REACT_APP_API_URL=http://your-eb-url.elasticbeanstalk.com
  REACT_APP_SOCKET_URL=http://your-eb-url.elasticbeanstalk.com
  ```

- [ ] **Build & Deploy Frontend**
  ```powershell
  cd client
  npm run build
  aws s3 mb s3://taskmaster-app-yourname
  aws s3 sync build/ s3://taskmaster-app-yourname
  aws s3 website s3://taskmaster-app-yourname --index-document index.html
  ```

### Option B: AWS EC2 with Docker

- [ ] **Launch EC2 Instance**
  - AMI: Ubuntu 22.04 or Amazon Linux 2
  - Instance Type: t2.small (or t2.micro for testing)
  - Security Group: Allow ports 22, 80, 443, 3000, 5000

- [ ] **Connect & Setup**
  ```bash
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

- [ ] **Deploy App**
  ```bash
  # Upload project or clone from Git
  git clone your-repo-url
  cd TaskMaster
  
  # Create .env file
  nano server/.env
  # Add MongoDB connection string
  
  # Start services
  docker-compose up -d
  ```

---

## Post-Deployment Configuration

- [ ] **SSL/HTTPS Setup**
  - [ ] Get SSL certificate from AWS Certificate Manager (free)
  - [ ] Configure CloudFront or Load Balancer for HTTPS
  - [ ] Update URLs to use `https://`

- [ ] **Domain Setup (Optional)**
  - [ ] Purchase domain or use existing
  - [ ] Configure Route 53 or your DNS provider
  - [ ] Point domain to AWS resources

- [ ] **CORS Configuration**
  - [ ] Update backend CORS to allow your production domain
  - [ ] Remove development URLs from allowed origins

- [ ] **Environment Variables**
  - [ ] Verify all secrets are set
  - [ ] Use strong, random JWT_SECRET (min 32 chars)
  - [ ] Never commit .env files

---

## Testing in Production

- [ ] **Frontend Testing**
  - [ ] Can access website
  - [ ] UI loads correctly
  - [ ] No console errors

- [ ] **Authentication**
  - [ ] Register new user
  - [ ] Login works
  - [ ] JWT token issued correctly

- [ ] **Task Management**
  - [ ] Create task
  - [ ] View tasks
  - [ ] Update task status
  - [ ] Tasks persist after refresh

- [ ] **Real-time Features**
  - [ ] Open app in 2 browsers
  - [ ] Create task in one browser
  - [ ] Verify it appears in other browser

- [ ] **Comments & Attachments**
  - [ ] Add comment to task
  - [ ] Upload file attachment
  - [ ] View activity log

- [ ] **Mobile Responsiveness**
  - [ ] Test on mobile device
  - [ ] Check layout and functionality

---

## Monitoring & Maintenance

- [ ] **Set Up Monitoring**
  - [ ] Enable AWS CloudWatch
  - [ ] Set up alerts for errors
  - [ ] Monitor CPU and memory usage

- [ ] **Logging**
  - [ ] Configure log retention
  - [ ] Set up error tracking (optional: Sentry)

- [ ] **Backups**
  - [ ] Enable MongoDB Atlas automated backups
  - [ ] Document backup restoration process

- [ ] **Performance**
  - [ ] Test app speed
  - [ ] Enable caching if needed
  - [ ] Consider CDN for static assets

---

## Security Hardening

- [ ] **Update Security Groups**
  - [ ] Restrict SSH access to your IP only
  - [ ] Only necessary ports open

- [ ] **MongoDB Security**
  - [ ] Use strong password
  - [ ] Whitelist only EC2 IP (not 0.0.0.0/0)
  - [ ] Enable MongoDB encryption at rest

- [ ] **Application Security**
  - [ ] Add rate limiting (express-rate-limit)
  - [ ] Validate all user inputs
  - [ ] Sanitize file uploads
  - [ ] Add helmet.js for security headers

---

## Cost Optimization

- [ ] **Use Free Tiers**
  - [ ] MongoDB Atlas M0 (512MB free forever)
  - [ ] AWS EC2 t2.micro (750 hrs/month free for 12 months)
  - [ ] S3 5GB storage (12 months)

- [ ] **Set Billing Alerts**
  - [ ] Configure AWS budget alerts
  - [ ] Monitor usage regularly

- [ ] **Optimize Resources**
  - [ ] Use auto-scaling
  - [ ] Stop EC2 instances when not needed
  - [ ] Clean up unused S3 files

---

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify environment variables
- Check EB/EC2 logs: `eb logs` or `docker-compose logs`

### Frontend can't reach backend
- Verify CORS settings
- Check backend URL in .env.production
- Ensure backend is running: test API endpoint directly

### Socket.IO not connecting
- Check WebSocket support in load balancer
- Verify Socket.IO URL matches backend URL
- Enable sticky sessions in ALB

### File uploads fail
- Check uploads/ folder permissions
- Consider using S3 for file storage
- Verify file size limits

---

## Quick Reference URLs

- **MongoDB Atlas**: https://cloud.mongodb.com
- **AWS Console**: https://console.aws.amazon.com
- **AWS Free Tier**: https://aws.amazon.com/free
- **EB Documentation**: https://docs.aws.amazon.com/elasticbeanstalk

---

## Estimated Timeline

- [ ] Day 1: MongoDB Atlas setup + AWS account (30 min)
- [ ] Day 2: Deploy backend to AWS (1-2 hours)
- [ ] Day 3: Deploy frontend to S3 (30 min)
- [ ] Day 4: Configure domain & SSL (1 hour)
- [ ] Day 5: Testing & monitoring setup (1 hour)

**Total: 5-7 hours** for complete deployment

---

## Success Criteria ✅

- [ ] App accessible via public URL
- [ ] All features working in production
- [ ] Real-time updates functioning
- [ ] File uploads working
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Monitoring active
- [ ] Under $15/month cost (within free tier)

---

**🎉 Once all checked, your TaskMaster app is live on AWS!**

Need help? Refer to AWS_DEPLOYMENT_GUIDE.md for detailed steps.
