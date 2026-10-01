from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.skill import Skill
from app.models.course import Course
from app.models.project import Project
from app.models.roadmap import RoadmapPhase
from app.models.progress import Progress
from app.models.evidence import Evidence
from app.models.mentor import MentorFeedback
from app.models.readiness import ReadinessSnapshot
from app.models.company import Company, CompanyRole
from app.models.notification import Notification


def seed_demo_data(db: Session):
    """
    Seeds initial realistic demo records for PathForge AI.
    Executes idempotently: skips seeding if records already exist.
    """
    # 1. Check if user already exists
    existing_user = db.query(User).first()
    if existing_user:
        return

    # Create primary demo user
    user = User(
        name="Alex Morgan",
        email="alex.morgan@pathforge.ai",
        target_role="Senior AI Platform Engineer",
        experience_level="Mid-Level (3+ Years Experience)",
        learning_goal="Master distributed model inference, LLMOps latency optimization, and enterprise RAG architecture.",
        weekly_learning_hours=14,
        preferred_learning_style="Hands-on Architectures & Benchmarking",
        current_streak=19,
        readiness_score=78.4,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Seed Skills (11 diverse skills with level from 0 to 100)
    demo_skills = [
        Skill(
            name="Python & PyTorch",
            category="Core AI",
            current_level=88.0,
            required_level=90.0,
            status="Acquired",
            priority="High",
            description="Deep neural network development, autograd profiling, custom dataset loaders, and distributed tensor operations.",
            user_id=user.id,
        ),
        Skill(
            name="Distributed ML Systems",
            category="ML Engineering",
            current_level=72.0,
            required_level=85.0,
            status="In Progress",
            priority="High",
            description="DDP, FSDP, DeepSpeed zero-redundancy optimizer, and pipeline parallelism across multi-GPU nodes.",
            user_id=user.id,
        ),
        Skill(
            name="Vector Databases & RAG",
            category="Applied AI",
            current_level=84.0,
            required_level=85.0,
            status="Acquired",
            priority="High",
            description="Dense retrieval, cross-encoder reranking, hybrid BM25 + vector search, and contextual chunking strategies.",
            user_id=user.id,
        ),
        Skill(
            name="MLOps & CI/CD Pipelines",
            category="Infrastructure",
            current_level=65.0,
            required_level=80.0,
            status="Gap",
            priority="High",
            description="Automated model testing, artifact lineage with MLflow/Weights & Biases, canary deployments, and drift monitors.",
            user_id=user.id,
        ),
        Skill(
            name="Model Quantization & TensorRT",
            category="Optimization",
            current_level=55.0,
            required_level=75.0,
            status="Gap",
            priority="Medium",
            description="FP8/INT4 quantization with AWQ and GPTQ, TensorRT-LLM compilation, and KV-cache compression.",
            user_id=user.id,
        ),
        Skill(
            name="Docker & Kubernetes Orchestration",
            category="DevOps",
            current_level=80.0,
            required_level=80.0,
            status="Acquired",
            priority="Medium",
            description="Containerization of GPU workloads, NVIDIA container runtime, K8s DaemonSets, and autoscaling node pools.",
            user_id=user.id,
        ),
        Skill(
            name="FastAPI & High-Throughput APIs",
            category="Backend",
            current_level=92.0,
            required_level=85.0,
            status="Acquired",
            priority="High",
            description="Asynchronous concurrency, streaming server-sent events, OpenAPI specifications, and token validation.",
            user_id=user.id,
        ),
        Skill(
            name="Triton Inference Server",
            category="Serving",
            current_level=48.0,
            required_level=70.0,
            status="Gap",
            priority="High",
            description="Dynamic batching, model pipelines with ensemble schedulers, and GPU memory pin memory optimization.",
            user_id=user.id,
        ),
        Skill(
            name="CUDA Kernels & Memory Management",
            category="Systems",
            current_level=52.0,
            required_level=75.0,
            status="Gap",
            priority="Medium",
            description="CUDA threads, shared memory bank conflict resolution, warp divergence avoidance, and PyTorch C++ extensions.",
            user_id=user.id,
        ),
        Skill(
            name="Prompt Engineering & Agentic Workflows",
            category="Applied AI",
            current_level=86.0,
            required_level=80.0,
            status="Acquired",
            priority="High",
            description="Multi-agent orchestration, tool-use verification, structured schema decoding, and self-correction loops.",
            user_id=user.id,
        ),
        Skill(
            name="Graph Neural Networks & Reasoning",
            category="Research",
            current_level=40.0,
            required_level=65.0,
            status="Gap",
            priority="Low",
            description="Message passing neural networks on heterogeneous knowledge graphs for grounded enterprise reasoning.",
            user_id=user.id,
        ),
    ]
    db.add_all(demo_skills)

    # 3. Seed Courses (6+ courses)
    demo_courses = [
        Course(
            title="Advanced Distributed Training with PyTorch",
            provider="DeepLearning.AI",
            description="Learn how to scale large language models and vision transformers across multi-node GPU clusters.",
            category="ML Engineering",
            difficulty="Advanced",
            duration_hours=18.0,
            rating=4.9,
            url="https://deeplearning.ai/courses/distributed-training",
            is_completed=True,
            progress_percentage=100.0,
        ),
        Course(
            title="Production LLMOps: Monitoring, Evaluation & Serving",
            provider="Weights & Biases Academy",
            description="Deep dive into continuous model evaluation, LLM red-teaming, prompt regression testing, and observability.",
            category="MLOps",
            difficulty="Intermediate",
            duration_hours=14.0,
            rating=4.8,
            url="https://wandb.ai/courses/llmops",
            is_completed=False,
            progress_percentage=65.0,
        ),
        Course(
            title="High-Throughput Inference with Triton & vLLM",
            provider="NVIDIA DLI",
            description="Master PagedAttention, continuous batching, model parallelism, and FP8 quantization deployment.",
            category="Serving",
            difficulty="Advanced",
            duration_hours=12.0,
            rating=4.9,
            url="https://nvidia.com/dli/triton-vllm",
            is_completed=False,
            progress_percentage=40.0,
        ),
        Course(
            title="Enterprise RAG Architectures & Vector Search",
            provider="Pinecone Systems",
            description="Design fault-tolerant production retrieval pipelines with metadata filtering and reciprocal rank fusion.",
            category="Applied AI",
            difficulty="Intermediate",
            duration_hours=10.0,
            rating=4.7,
            url="https://pinecone.io/learn/enterprise-rag",
            is_completed=True,
            progress_percentage=100.0,
        ),
        Course(
            title="CUDA C++ Programming for Deep Learning",
            provider="Udacity Advanced Tech",
            description="Write performant custom CUDA kernels, understand warp dispatchers, and profile with NVIDIA Nsight Compute.",
            category="Systems",
            difficulty="Advanced",
            duration_hours=24.0,
            rating=4.8,
            url="https://udacity.com/course/cuda-cpp",
            is_completed=False,
            progress_percentage=25.0,
        ),
        Course(
            title="Kubernetes for Machine Learning Engineers",
            provider="Linux Foundation",
            description="Deploy and manage elastic training and inference workloads using Kubernetes, Ray, and KubeFlow.",
            category="DevOps",
            difficulty="Intermediate",
            duration_hours=16.0,
            rating=4.7,
            url="https://linuxfoundation.org/courses/k8s-for-ml",
            is_completed=False,
            progress_percentage=50.0,
        ),
    ]
    db.add_all(demo_courses)

    # 4. Seed Projects (5+ projects)
    demo_projects = [
        Project(
            title="UltraScale RAG Pipeline: Hybrid Search & Cross-Encoder Reranking",
            description="Engineered an enterprise semantic search engine index over 2M documentation items with sub-40ms P95 latency.",
            category="Applied AI",
            difficulty="Advanced",
            estimated_hours=30,
            status="Completed",
            progress_percentage=100.0,
            github_url="https://github.com/pathforge-demo/ultrascale-rag",
            demo_url="https://demo.pathforge.ai/rag",
        ),
        Project(
            title="Real-Time LLM Serving Engine with vLLM & Streaming SSE",
            description="Built a high-concurrency token streaming proxy with dynamic request queuing and latency telemetry.",
            category="ML Engineering",
            difficulty="Advanced",
            estimated_hours=25,
            status="In Progress",
            progress_percentage=70.0,
            github_url="https://github.com/pathforge-demo/vllm-streaming-server",
            demo_url="https://demo.pathforge.ai/llm-stream",
        ),
        Project(
            title="Distributed LoRA Fine-Tuning Cluster with Ray & PyTorch",
            description="Designed an elastic training pipeline that distributes parameter-efficient fine-tuning across 8x L4 GPUs.",
            category="Systems",
            difficulty="Advanced",
            estimated_hours=35,
            status="In Progress",
            progress_percentage=45.0,
            github_url="https://github.com/pathforge-demo/lora-ray-cluster",
            demo_url=None,
        ),
        Project(
            title="Explainable Model Diagnostics & Bias Audit Suite",
            description="Implemented SHAP/Integrated Gradients visualizer for classification embeddings and hallucination detection.",
            category="Interpretability",
            difficulty="Intermediate",
            estimated_hours=20,
            status="In Progress",
            progress_percentage=30.0,
            github_url="https://github.com/pathforge-demo/xai-diagnostics",
            demo_url="https://demo.pathforge.ai/xai",
        ),
        Project(
            title="Automated MLOps Pipeline with Kubeflow & MLflow",
            description="End-to-end continuous training and automated canary deployment system with automated rollback upon metric degradation.",
            category="MLOps",
            difficulty="Intermediate",
            estimated_hours=28,
            status="Not Started",
            progress_percentage=0.0,
            github_url="https://github.com/pathforge-demo/mlops-pipeline",
            demo_url=None,
        ),
    ]
    db.add_all(demo_projects)

    # 5. Seed Roadmap Phases (5 phases)
    demo_roadmap = [
        RoadmapPhase(
            title="Phase 1: Deep Learning Foundations & Distributed Tensor Computation",
            description="Establish rigorous mastery over autograd, loss surfaces, GPU memory profiling, and tensor mechanics.",
            phase_number=1,
            status="Completed",
            progress_percentage=100.0,
            estimated_weeks=4,
            order_index=1,
        ),
        RoadmapPhase(
            title="Phase 2: Scalable Fine-Tuning & Parameter-Efficient Architectures",
            description="Master LoRA, QLoRA, DeepSpeed ZeRO stages, and multi-GPU distributed data parallel pipelines.",
            phase_number=2,
            status="Completed",
            progress_percentage=100.0,
            estimated_weeks=5,
            order_index=2,
        ),
        RoadmapPhase(
            title="Phase 3: High-Throughput Model Serving & Latency Engineering",
            description="Implement continuous batching, PagedAttention, Triton C++ backends, and vLLM production configurations.",
            phase_number=3,
            status="In Progress",
            progress_percentage=65.0,
            estimated_weeks=4,
            order_index=3,
        ),
        RoadmapPhase(
            title="Phase 4: Production LLMOps, CI/CD, Observability & Guardrails",
            description="Build automated benchmark evaluation suites, drift monitors, canary routing, and cost telemetry.",
            phase_number=4,
            status="Available",
            progress_percentage=10.0,
            estimated_weeks=4,
            order_index=4,
        ),
        RoadmapPhase(
            title="Phase 5: Enterprise Systems Capstone & System Design Mastery",
            description="Synthesize all competencies into an end-to-end resilient AI platform and conduct mock architecture panels.",
            phase_number=5,
            status="Locked",
            progress_percentage=0.0,
            estimated_weeks=3,
            order_index=5,
        ),
    ]
    db.add_all(demo_roadmap)

    # 6. Seed Progress Records
    now = datetime.utcnow()
    demo_progress = [
        Progress(
            user_id=user.id,
            activity_type="Course",
            activity_title="Completed: Enterprise RAG Architectures & Vector Search",
            progress_value=100.0,
            activity_date=now - timedelta(days=1),
            notes="Mastered hybrid search with Reciprocal Rank Fusion.",
        ),
        Progress(
            user_id=user.id,
            activity_type="Project",
            activity_title="UltraScale RAG Pipeline: Milestone 3 P95 Benchmark Passed",
            progress_value=100.0,
            activity_date=now - timedelta(days=2),
            notes="Achieved 38ms latency for 100 concurrent queries.",
        ),
        Progress(
            user_id=user.id,
            activity_type="Skill",
            activity_title="Skill Assessed: FastAPI & High-Throughput APIs (+8 pts)",
            progress_value=92.0,
            activity_date=now - timedelta(days=3),
            notes="Passed verified coding assessment with 100% throughput coverage.",
        ),
        Progress(
            user_id=user.id,
            activity_type="Mentor Feedback",
            activity_title="Reviewed by Dr. Aris Thorne (Staff ML Engineer)",
            progress_value=85.0,
            activity_date=now - timedelta(days=5),
            notes="Commended clean PagedAttention integration; recommended FP8 profiling.",
        ),
        Progress(
            user_id=user.id,
            activity_type="Evidence",
            activity_title="Verified Certificate: Advanced Distributed Training with PyTorch",
            progress_value=100.0,
            activity_date=now - timedelta(days=8),
            notes="Credential verified and published to profile evidence showcase.",
        ),
    ]
    db.add_all(demo_progress)

    # 7. Seed Evidence Items
    demo_evidence = [
        Evidence(
            user_id=user.id,
            title="DeepLearning.AI Distributed PyTorch Specialization Certificate",
            description="Official certificate validating multi-GPU DDP training and zero-redundancy optimizer configurations.",
            evidence_type="Certificate",
            url="https://credentials.deeplearning.ai/alex-morgan-pytorch-dist",
            verification_status="Verified",
            portfolio_ready=True,
        ),
        Evidence(
            user_id=user.id,
            title="UltraScale RAG Production Repository",
            description="Open-source repository containing reproducible Dockerized deployment, locust stress tests, and API specs.",
            evidence_type="GitHub Repository",
            url="https://github.com/pathforge-demo/ultrascale-rag",
            verification_status="Verified",
            portfolio_ready=True,
        ),
        Evidence(
            user_id=user.id,
            title="Live Interactive Token Streaming Benchmark Demo",
            description="Interactive dashboard showing live token generation metrics, time-to-first-token (TTFT), and inter-token latency.",
            evidence_type="Project Demo",
            url="https://demo.pathforge.ai/rag",
            verification_status="Verified",
            portfolio_ready=True,
        ),
        Evidence(
            user_id=user.id,
            title="High-Concurrency Async FastAPI Architecture Assessment",
            description="Peer-reviewed benchmark report assessing throughput under simulated 5,000 req/sec loads.",
            evidence_type="Assessment",
            url="https://assessments.pathforge.ai/report-49821",
            verification_status="Verified",
            portfolio_ready=False,
        ),
    ]
    db.add_all(demo_evidence)

    # 8. Seed Mentor Feedback
    demo_mentor_feedback = [
        MentorFeedback(
            user_id=user.id,
            mentor_name="Dr. Aris Thorne",
            mentor_role="Staff Distributed ML Systems Engineer @ Databricks",
            feedback_title="Excellent PagedAttention Implementation with Clear Latency Budgets",
            feedback_text="Alex demonstrated outstanding command of KV-cache memory dynamics in their streaming proxy. For the next iteration, I advise profiling custom Triton CUDA kernels to eliminate CPU dispatch overhead during token generation.",
            feedback_type="Architecture Review",
            status="Received",
            priority="High",
            created_at=now - timedelta(days=5),
        ),
        MentorFeedback(
            user_id=user.id,
            mentor_name="Elena Rostova",
            mentor_role="Head of AI Infrastructure @ Cohere",
            feedback_title="RAG Cross-Encoder Reranking Trade-off Analysis",
            feedback_text="Great architectural intuition on caching intermediate embeddings. Consider evaluating late-interaction ColBERT models as an alternative to full cross-encoders to improve throughput by 4x without precision degradation.",
            feedback_type="Code Review",
            status="Received",
            priority="Medium",
            created_at=now - timedelta(days=12),
        ),
    ]
    db.add_all(demo_mentor_feedback)

    # 9. Seed Readiness Snapshot
    demo_readiness = ReadinessSnapshot(
        user_id=user.id,
        overall_score=78.4,
        skill_coverage_score=82.0,
        project_score=80.5,
        consistency_score=88.0,
        evidence_score=74.0,
        mentor_score=70.0,
        readiness_level="Senior AI Ready",
        calculated_at=now,
    )
    db.add(demo_readiness)

    # 10. Seed Companies and Company Roles (Demo Data)
    demo_companies = [
        Company(
            name="Anthropic (Demo)",
            description="AI safety and research company creating reliable, beneficial AI systems like Claude.",
            website="https://anthropic.com",
        ),
        Company(
            name="OpenAI (Demo)",
            description="Pioneering artificial general intelligence research and deployment company.",
            website="https://openai.com",
        ),
        Company(
            name="Scale AI (Demo)",
            description="The data foundry for AI, providing infrastructure for high-accuracy foundation models.",
            website="https://scale.com",
        ),
        Company(
            name="Google DeepMind (Demo)",
            description="World-leading AI laboratory solving intelligence to advance science and benefit humanity.",
            website="https://deepmind.google",
        ),
    ]
    db.add_all(demo_companies)
    db.commit()  # commit to acquire company IDs

    demo_roles = [
        CompanyRole(
            company_id=demo_companies[0].id,
            role_title="Senior Platform Inference Engineer",
            description="Lead the design and operation of scalable inference clusters serving billions of daily tokens with strict SLA requirements.",
            required_skills=["Distributed ML Systems", "Triton Inference Server", "FastAPI & High-Throughput APIs", "Vector Databases & RAG"],
            match_score=91.0,
            readiness_level="High Match",
        ),
        CompanyRole(
            company_id=demo_companies[1].id,
            role_title="AI Infrastructure Systems Engineer",
            description="Architect GPU cluster scheduling, optimize network topology for all-reduce collectives, and streamline model weights synchronization.",
            required_skills=["Distributed ML Systems", "CUDA Kernels & Memory Management", "Docker & Kubernetes Orchestration", "Python & PyTorch"],
            match_score=87.0,
            readiness_level="High Match",
        ),
        CompanyRole(
            company_id=demo_companies[2].id,
            role_title="Enterprise GenAI Systems Architect",
            description="Build robust RAG pipelines, model evaluation harness systems, and custom fine-tuning workflows for enterprise deployments.",
            required_skills=["Vector Databases & RAG", "Prompt Engineering & Agentic Workflows", "MLOps & CI/CD Pipelines"],
            match_score=84.0,
            readiness_level="Strong Match",
        ),
        CompanyRole(
            company_id=demo_companies[3].id,
            role_title="Research Platform & Compute Engineer",
            description="Partner with research scientists to scale frontier models on massive distributed superclusters and write optimized PyTorch kernels.",
            required_skills=["Python & PyTorch", "CUDA Kernels & Memory Management", "Distributed ML Systems"],
            match_score=79.0,
            readiness_level="Moderate Match",
        ),
    ]
    db.add_all(demo_roles)

    # 11. Seed Notifications
    demo_notifications = [
        Notification(
            user_id=user.id,
            title="Readiness Milestone Unlocked",
            message="Your overall career readiness score increased to 78.4% after validating your RAG production evidence.",
            notification_type="achievement",
            related_route="/app/readiness",
            is_read=False,
        ),
        Notification(
            user_id=user.id,
            title="New Mentor Feedback Received",
            message="Dr. Aris Thorne submitted an architecture review on your PagedAttention implementation.",
            notification_type="feedback",
            related_route="/app/mentor",
            is_read=False,
        ),
        Notification(
            user_id=user.id,
            title="Learning Streak Preserved",
            message="Congratulations! You have logged learning activity for 19 consecutive days.",
            notification_type="reminder",
            related_route="/app",
            is_read=True,
        ),
    ]
    db.add_all(demo_notifications)

    db.commit()
