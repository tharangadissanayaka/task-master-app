provider "aws" {
  region = "us-east-1"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS (us-east-1), verify latest ID
  instance_type = "t2.micro"
  key_name      = "your-key-pair-name" # creating this manually in AWS console is recommended
  vpc_security_group_ids = [aws_security_group.taskmaster_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "TaskMaster-App"
  }
}

output "public_ip" {
  value = aws_instance.app_server.public_ip
}
