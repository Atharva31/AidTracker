from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base


class StaffMember(Base):
    __tablename__ = "Staff_Members"

    staff_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    phone_number = Column(String(20))
    role = Column(
        Enum('admin', 'manager', 'worker', 'volunteer', name='staff_role_enum'),
        default='worker',
        index=True
    )
    center_id = Column(Integer, ForeignKey('Distribution_Centers.center_id', ondelete='SET NULL'), index=True)
    hire_date = Column(Date, nullable=False)
    status = Column(
        Enum('active', 'inactive', 'on_leave', name='staff_status_enum'),
        default='active',
        index=True
    )
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    )

    # Relationships
    center = relationship("DistributionCenter", back_populates="staff_members")
    distribution_logs = relationship("DistributionLog", back_populates="staff")
