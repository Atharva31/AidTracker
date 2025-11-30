from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base


class DistributionCenter(Base):
    __tablename__ = "Distribution_Centers"

    center_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    center_name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(10), nullable=False)
    phone_number = Column(String(20))
    email = Column(String(100))
    capacity = Column(Integer, nullable=False, default=1000)
    status = Column(
        Enum('active', 'inactive', 'maintenance', name='center_status_enum'),
        default='active',
        index=True
    )
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    )

    # Relationships
    inventory = relationship("Inventory", back_populates="center", cascade="all, delete-orphan")
    distribution_logs = relationship("DistributionLog", back_populates="center")
    staff_members = relationship("StaffMember", back_populates="center")
