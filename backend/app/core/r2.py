import boto3
from app.core.config import get_settings


def get_r2_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=settings.cloudflare_r2_endpoint_url,
        aws_access_key_id=settings.cloudflare_r2_access_key_id,
        aws_secret_access_key=settings.cloudflare_r2_secret_access_key,
        region_name="auto",
    )


def upload_to_r2(file_bytes: bytes, key: str, content_type: str = "application/pdf") -> str:
    settings = get_settings()
    client = get_r2_client()
    client.put_object(
        Bucket=settings.cloudflare_r2_bucket_name,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.cloudflare_r2_bucket_name, "Key": key},
        ExpiresIn=3600,
    )
    return url
