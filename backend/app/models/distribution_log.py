from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base


class DistributionLog(Base):
    __tablename__ = "Distribution_Log"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    household_id = Column(Integer, ForeignKey('Households.household_id', ondelete='RESTRICT'), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey('Aid_Packages.package_id', ondelete='RESTRICT'), nullable=False, index=True)
    center_id = Column(Integer, ForeignKey('Distribution_Centers.center_id', ondelete='RESTRICT'), nullable=False, index=True)
    staff_id = Column(Integer, ForeignKey('Staff_Members.staff_id', ondelete='SET NULL'), index=True)
    quantity_distributed = Column(Integer, nullable=False, default=1)
    distribution_date = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'), index=True)
    transaction_status = Column(
        Enum('success', 'failed', 'cancelled', name='transaction_status_enum'),
        default='success',
        index=True
    )
    failure_reason = Column(String(255))
    notes = Column(Text)

    # Relationships
    household = relationship("Household", back_populates="distribution_logs")
    package = relationship("AidPackage", back_populates="distribution_logs")
    center = relationship("DistributionCenter", back_populates="distribution_logs")
    staff = relationship("StaffMember", back_populates="distribution_logs")
