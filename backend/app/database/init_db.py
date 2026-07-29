"""
AgentVerse — Database Initialization & Seeding
================================================
Creates all database tables on startup (for development/initial setup).
Automatically creates the target database if it does not exist (PostgreSQL/SQLite).
Seeds initial Freelancer pool if empty.
"""

from sqlalchemy import text, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

from app.config.settings import settings
from app.database.base import Base
from app.database.session import engine, AsyncSessionFactory
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def _create_db_if_missing() -> None:
    """
    If using PostgreSQL and the target database does not exist,
    connects to the default 'postgres' system database and creates it automatically.
    """
    try:
        url = make_url(settings.DATABASE_URL)
        if "postgresql" in url.drivername and url.database and url.database != "postgres":
            db_name = url.database
            admin_url = url._replace(database="postgres")
            admin_engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
            
            try:
                async with admin_engine.connect() as conn:
                    result = await conn.execute(
                        text(f"SELECT 1 FROM pg_database WHERE datname = :dbname"),
                        {"dbname": db_name},
                    )
                    if not result.scalar():
                        logger.info(f"PostgreSQL database '{db_name}' does not exist. Creating automatically...")
                        await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                        logger.info(f"PostgreSQL database '{db_name}' created successfully!")
            except Exception as e:
                logger.warning(f"Auto-create database check skipped/failed: {e}")
            finally:
                await admin_engine.dispose()
    except Exception as e:
        logger.debug(f"DB creation helper info: {e}")


async def _seed_freelancers() -> None:
    """
    Seeds initial pool of 10 freelancers into database if table is empty,
    and updates legacy records with default hashed password.
    """
    from app.models.freelancer import Freelancer
    from app.core.security import hash_password

    demo_pass = hash_password("Demo@1234")

    async with AsyncSessionFactory() as session:
        result = await session.execute(select(Freelancer))
        freelancers_list = result.scalars().all()

        if len(freelancers_list) > 0:
            # Update any existing freelancers missing password
            updated = False
            for f in freelancers_list:
                if not f.hashed_password:
                    f.hashed_password = demo_pass
                    updated = True
            if updated:
                await session.commit()
                logger.info("Updated existing freelancers with demo password.")
            else:
                logger.info(f"Freelancer pool ready ({len(freelancers_list)} freelancers in DB)")
            return

        logger.info("Seeding initial 10 freelancer profiles into database...")

        seed_data = [
            {
                "name": "Rahul Sharma",
                "email": "rahul.sharma@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
                "title": "Senior Full-Stack & Python Architect",
                "skills": ["React", "FastAPI", "Python", "TypeScript", "PostgreSQL", "Docker", "Node.js", "Redis"],
                "experience": 7.0,
                "rating": 4.9,
                "completed_projects": 42,
                "availability": "Available",
                "status": "Active",
                "bio": "Full-stack architect with 7+ years of experience building high-scale web platforms and REST/GraphQL APIs.",
            },
            {
                "name": "Priya Singh",
                "email": "priya.singh@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
                "title": "React & Next.js Frontend Specialist",
                "skills": ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux", "GraphQL", "UI/UX", "JavaScript"],
                "experience": 5.0,
                "rating": 4.85,
                "completed_projects": 31,
                "availability": "Available",
                "status": "Active",
                "bio": "Passionate React engineer crafting high-performance, pixel-perfect web application interfaces.",
            },
            {
                "name": "Arun Kumar",
                "email": "arun.kumar@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
                "title": "FastAPI & AI Systems Expert",
                "skills": ["Python", "FastAPI", "OpenAI", "PyTorch", "LangChain", "PostgreSQL", "SQLAlchemy", "Docker"],
                "experience": 6.0,
                "rating": 4.9,
                "completed_projects": 28,
                "availability": "Available",
                "status": "Active",
                "bio": "AI backend specialist building intelligent automation services and asynchronous FastAPI architectures.",
            },
            {
                "name": "David Chen",
                "email": "david.chen@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300",
                "title": "DevOps & Cloud Infrastructure Engineer",
                "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Python", "Nginx"],
                "experience": 8.0,
                "rating": 4.95,
                "completed_projects": 55,
                "availability": "Available",
                "status": "Active",
                "bio": "Cloud DevOps engineer specializing in container orchestration, infrastructure-as-code, and zero-downtime CI/CD.",
            },
            {
                "name": "Sarah Jenkins",
                "email": "sarah.jenkins@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
                "title": "Enterprise Spring Boot & Java Engineer",
                "skills": ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Redis", "Kafka", "Hibernate", "Docker"],
                "experience": 6.5,
                "rating": 4.75,
                "completed_projects": 24,
                "availability": "Available",
                "status": "Active",
                "bio": "Senior enterprise backend software engineer designing robust distributed microservice platforms.",
            },
            {
                "name": "Alex Rivera",
                "email": "alex.rivera@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
                "title": "MERN Stack & Real-Time App Developer",
                "skills": ["MongoDB", "Express", "React", "Node.js", "Socket.io", "TypeScript", "TailwindCSS"],
                "experience": 4.5,
                "rating": 4.8,
                "completed_projects": 36,
                "availability": "Available",
                "status": "Active",
                "bio": "MERN Stack developer focused on collaborative tools, live dashboards, and WebSocket event streaming.",
            },
            {
                "name": "Anita Patel",
                "email": "anita.patel@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
                "title": "Flutter & Cross-Platform Mobile Engineer",
                "skills": ["Flutter", "Dart", "React Native", "iOS", "Android", "Firebase", "REST API", "UI Design"],
                "experience": 5.0,
                "rating": 4.9,
                "completed_projects": 29,
                "availability": "Available",
                "status": "Active",
                "bio": "Mobile engineer delivering fluid, highly scalable iOS and Android apps with Flutter and Firebase.",
            },
            {
                "name": "Vikram Malhotra",
                "email": "vikram.malhotra@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
                "title": "Database Architect & Python Backend Engineer",
                "skills": ["Python", "Django", "SQL", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "System Architecture"],
                "experience": 9.0,
                "rating": 4.95,
                "completed_projects": 62,
                "availability": "Available",
                "status": "Active",
                "bio": "Database performance tuner and senior Python architect specializing in high-concurrency systems.",
            },
            {
                "name": "Elena Rostova",
                "email": "elena.rostova@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
                "title": "UI/UX Designer & Frontend Engineer",
                "skills": ["React", "Figma", "CSS3", "HTML5", "TailwindCSS", "Framer Motion", "JavaScript"],
                "experience": 4.0,
                "rating": 4.82,
                "completed_projects": 22,
                "availability": "Available",
                "status": "Active",
                "bio": "Design engineer bridging the gap between sleek Figma visual prototypes and interactive React applications.",
            },
            {
                "name": "Karthik Raja",
                "email": "karthik.raja@freelancer.ai",
                "profile_image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300",
                "title": "CyberSecurity & Go/FastAPI Specialist",
                "skills": ["Python", "FastAPI", "Go", "OAuth2", "Security Audit", "Docker", "Linux", "PostgreSQL"],
                "experience": 7.0,
                "rating": 4.88,
                "completed_projects": 33,
                "availability": "Available",
                "status": "Active",
                "bio": "Backend security engineer specializing in vulnerability testing, data encryption, and hardened API security.",
            },
        ]

        for item in seed_data:
            f = Freelancer(**item)
            session.add(f)

        await session.commit()
        logger.info("Successfully seeded 10 freelancer profiles into database.")


async def init_db() -> None:
    """
    Create all tables that don't exist yet and seed initial data.
    """
    # Import models inside init_db to ensure they are registered with Base.metadata without circular imports
    from app.models.client import Client             # noqa: F401
    from app.models.project import Project           # noqa: F401
    from app.models.freelancer import Freelancer     # noqa: F401
    from app.models.project_match import ProjectMatch # noqa: F401

    # Attempt auto-creation of PostgreSQL database if missing
    await _create_db_if_missing()

    try:
        async with engine.begin() as conn:
            logger.info("Initialising database tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables ready")

        # Seed Freelancers pool
        await _seed_freelancers()

    except Exception as exc:
        logger.error(
            "Failed to connect to database or create/seed tables",
            error=str(exc),
        )
        raise exc


async def drop_all_tables() -> None:
    """
    Drop all tables — DEVELOPMENT ONLY.
    Never call in production.
    """
    async with engine.begin() as conn:
        logger.warning("Dropping all database tables — DEVELOPMENT ONLY")
        await conn.run_sync(Base.metadata.drop_all)
        logger.warning("All tables dropped")
