"""OpenTelemetry tracing for the governance layer.

The track asks for OpenTelemetry-compliant audit logs and end-to-end reasoning
traces. ADK agents on Agent Runtime get tracing for free; the governance
decisions that run in our own service do not, so we emit them here. Each
routing decision and each human decision becomes a span carrying the numbers
that justified it, which is what makes a reasoning chain auditable rather than
merely logged.

Exports to Cloud Trace when running on Google Cloud; no-ops locally.
"""

from __future__ import annotations

import os

_tracer = None
_provider = None
_configured = False


def _setup():
    global _tracer, _provider, _configured
    if _configured:
        return
    _configured = True
    if not os.environ.get("GOOGLE_CLOUD_PROJECT"):
        return
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        provider = TracerProvider(
            resource=Resource.create({"service.name": "watchspan-governance"})
        )
        provider.add_span_processor(
            BatchSpanProcessor(
                CloudTraceSpanExporter(project_id=os.environ["GOOGLE_CLOUD_PROJECT"])
            )
        )
        trace.set_tracer_provider(provider)
        _provider = provider
        _tracer = trace.get_tracer("watchspan")
    except Exception:
        _tracer = None  # tracing must never break governance


class _NullSpan:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def set_attribute(self, *args, **kwargs):
        pass


def span(name: str, **attributes):
    """Start a span, or a no-op when tracing is unavailable."""
    _setup()
    if _tracer is None:
        return _NullSpan()
    context = _tracer.start_as_current_span(name)
    span_obj = getattr(context, "__enter__", None)
    if span_obj is None:
        return _NullSpan()
    return _AttributedSpan(context, attributes)


class _AttributedSpan:
    def __init__(self, context, attributes):
        self._context = context
        self._attributes = attributes

    def __enter__(self):
        current = self._context.__enter__()
        for key, value in self._attributes.items():
            if value is not None:
                current.set_attribute(f"watchspan.{key}", value)
        return current

    def __exit__(self, *args):
        return self._context.__exit__(*args)


def flush(timeout_ms: int = 10_000) -> bool:
    """Force pending spans out. Batch export would otherwise lose the tail of
    a short-lived request or a process that exits right after a run."""
    if _provider is None:
        return False
    try:
        return bool(_provider.force_flush(timeout_ms))
    except Exception:
        return False
