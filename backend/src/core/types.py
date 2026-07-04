"""Cross-database column types for SQLite dev and PostgreSQL production."""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import Uuid

JSONType = JSON().with_variant(JSONB(), "postgresql")
UUIDType = Uuid(as_uuid=True).with_variant(PG_UUID(as_uuid=True), "postgresql")
