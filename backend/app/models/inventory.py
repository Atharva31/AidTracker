from sqlalchemy import Column, Integer, Date, ForeignKey, TIMESTAMP, text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Inventory(Base):
    __tablename__ = "Inventory"

    inventory_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    center_id = Column(Integer, ForeignKey('Distribution_Centers.center_id', ondelete='CASCADE'), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey('Aid_Packages.package_id', ondelete='CASCADE'), nullable=False, index=True)
    quantity_on_hand = Column(Integer, nullable=False, default=0, index=True)
    reorder_level = Column(Integer, nullable=False, default=50)
    last_restock_date = Column(Date)
    last_restock_quantity = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        UniqueConstraint('center_id', 'package_id', name='uq_center_package'),
    )

    # Relationships
    center = relationship("DistributionCenter", back_populates="inventory")
    package = relationship("AidPackage", back_populates="inventory")
