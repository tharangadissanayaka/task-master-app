pipeline {
    agent any

    environment {

        DOCKER_CREDS_ID = "docker-hub-credentials"
        REGISTRY_URL = "docker.io" // You must update this with your actual username in the script below
        DOCKER_USER = "tharangadissanayaka"
        IMAGE_NAME = "taskmaster"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Use the registry prefix so we can push them later
                    sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}-backend:latest ./server"
                    sh "docker build -f client/Dockerfile.prod -t ${DOCKER_USER}/${IMAGE_NAME}-frontend:latest ./client"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDS_ID}", passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER_ENV')]) {
                        sh "docker login -u ${DOCKER_USER_ENV} -p ${DOCKER_PASS}"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}-backend:latest"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                script {
                    sh 'docker-compose -f docker-compose.prod.yml down --remove-orphans'
                    sh 'JWT_SECRET=fcb02a41fddfd7506628726e8d0b14b7d2b4c755ec486b2567ae22384441f76df docker-compose -f docker-compose.prod.yml up -d'
                    sh 'docker ps -a'
                }
            }
        }
    }
}
