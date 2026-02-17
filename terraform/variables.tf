variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "key_name" {
  description = "Name of the existing AWS Key Pair"
  type        = string
}

variable "public_key_path" {
  description = "Path to the public key file (e.g. ~/.ssh/id_rsa.pub) to create a new key pair (Optional)"
  default     = ""
}
