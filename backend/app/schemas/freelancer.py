"""
AgentVerse — Freelancer Pydantic Schemas
==========================================
Data transfer objects for freelancer authentication, registration, data validation and serialization.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator


class FreelancerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    profile_image: str = Field(default="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300")
    title: str = Field(..., description="Professional title (e.g. Full-Stack Developer)")
    skills: List[str] = Field(default_factory=list, description="Technical skills")
    experience: float = Field(default=1.0, ge=0, description="Years of experience")
    rating: float = Field(default=5.0, ge=0, le=5.0, description="Rating out of 5.0")
    completed_projects: int = Field(default=0, ge=0, description="Completed project count")
    availability: str = Field(default="Available", description="Work availability")
    status: str = Field(default="Active")
    bio: Optional[str] = None


class FreelancerCreate(FreelancerBase):
    pass


class FreelancerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    title: str = Field(..., min_length=2, max_length=255, description="Professional title")
    skills: Union[List[str], str] = Field(default_factory=list, description="List or comma-separated list of skills")
    experience: float = Field(default=1.0, ge=0)
    bio: Optional[str] = None

    @field_validator("skills", mode="before")

    def parse_skills(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


class FreelancerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class FreelancerResponse(FreelancerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
