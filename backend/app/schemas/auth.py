from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    fullName: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=200)


class AuthResponse(BaseModel):
    message: str
    userId: str
