pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'tharangadissanayaka'
    }

    stages {
        stage('Build Backend Image') {
            steps {
                echo "Building the backend image..."
                sh "docker build -t ${DOCKERHUB_USERNAME}/task-master-app-server:latest ./server"
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo "Building the frontend image..."
                sh "docker build -t ${DOCKERHUB_USERNAME}/task-master-app-client:latest ./client"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo "Logging in and pushing images..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    sh "docker push ${DOCKERHUB_USERNAME}/task-master-app-server:latest"
                    sh "docker push ${DOCKERHUB_USERNAME}/task-master-app-client:latest"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
            sh "docker logout"
        }
    }
}
