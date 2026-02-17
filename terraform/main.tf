provider "aws" {
  region     = var.region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_security_group" "taskmaster_sg" {
  name        = "taskmaster-sg"
  description = "Allow HTTP, Custom App, and SSH traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # For demo only, restrict in real prod
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Generate a new SSH key
resource "tls_private_key" "pk" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = var.key_name
  public_key = tls_private_key.pk.public_key_openssh
}

resource "local_file" "ssh_key" {
  content  = tls_private_key.pk.private_key_pem
  filename = "${path.module}/${var.key_name}.pem"
  file_permission = "0400"
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS (us-east-1), verify latest ID
  instance_type = "t3.micro" # t3.micro is also Free Tier eligible in most regions and newer
  key_name      = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.taskmaster_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              # Add Swap (prevent crash on t3.micro)
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # Update & Install Docker
              apt-get update
              apt-get install -y docker.io docker-compose fontconfig openjdk-17-jre
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu

              # Install Jenkins
              # Run Jenkins in Docker
              docker volume create jenkins_home
              chmod 666 /var/run/docker.sock
              docker run -d --name jenkins -p 8080:8080 -p 50000:50000 --restart=on-failure \
                -v jenkins_home:/var/jenkins_home \
                -v /var/run/docker.sock:/var/run/docker.sock \
                jenkins/jenkins:lts

              # Wait for container to be ready and install Docker CLI inside it
              sleep 30
              docker exec -u root jenkins apt-get update
              docker exec -u root jenkins apt-get install -y docker.io
              EOF

  tags = {
    Name = "TaskMaster-App"
  }
}

output "public_ip" {
  value = aws_instance.app_server.public_ip
}
