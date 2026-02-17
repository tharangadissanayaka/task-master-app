pipeline {
    agent any

    environment {
        // AWS Credentials should be configured in Jenkins Credentials
        // Docker Hub / ECR credentials likewise
        REGISTRY_URL = "my-docker-registry" // Update this
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
                    // Build Backend
                    sh 'docker build -t taskmaster-backend:latest ./server'
                    // Build Frontend (Use Prod Dockerfile)
                    sh 'docker build -f client/Dockerfile.prod -t taskmaster-frontend:latest ./client'
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                script {
                    // Example deployment: valid only if Jenkins is running on the server or has SSH access
                    // For a "fresh" setup, we assume Jenkins triggers the update via docker-compose
                    
                    // Stop old containers
                    sh 'docker-compose -f docker-compose.prod.yml down'
                    
                    // Start new containers
                    sh 'docker-compose -f docker-compose.prod.yml up -d'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
