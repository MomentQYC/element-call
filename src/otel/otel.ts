/*
Copyright 2023 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import opentelemetry from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

import { PosthogSpanExporter } from "../analytics/OtelPosthogExporter";

const SERVICE_NAME = "element-call";

const otlpExporter = new OTLPTraceExporter();
const consoleExporter = new ConsoleSpanExporter();
const posthogExporter = new PosthogSpanExporter();

// This is how we can make Jaeger show a reaonsable service in the dropdown on the left.
const providerConfig = {
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
  }),
};
const provider = new WebTracerProvider(providerConfig);

provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(posthogExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));
opentelemetry.trace.setGlobalTracerProvider(provider);

// This is not the serviceName shown in jaeger
export const tracer = opentelemetry.trace.getTracer(
  "my-element-call-otl-tracer"
);

/*
class CallTracer {
  // We create one tracer class for each main context.
  // Even if differnt tracer classes overlap in time space, we might want to visulaize them seperately.
  // The Call Tracer should only contain spans/events that are relevant to understand the procedure of the individual candidates.
  // Another Tracer Class (for example a ConnectionTracer) can contain a very granular list of all steps to connect to a call.

  private callSpan;
  private callContext;
  private muteSpan?;

  public startGroupCall(groupCallId: string) {}

  public startCall(callId: string) {
    // The main context will be set when initiating the main/parent span.

    // Create an initial context with the callId param
    const callIdContext = opentelemetry.context
      .active()
      .setValue(Symbol("callId"), callId);

    // Create the main span that tracks the whole call
    this.callSpan = tracer.startSpan("otel_callSpan", undefined, callIdContext);

    // Create a new call based on the callIdContext. This context also has a span assigned to it.
    // Other spans can use this context to extract the parent span.
    // (When passing this context to startSpan the started span will use the span set in the context (in this case the callSpan) as the parent)
    this.callContext = opentelemetry.trace.setSpan(
      opentelemetry.context.active(),
      this.callSpan
    );

    // Here we start a very short span. This is a hack to trigger the posthog exporter.
    // Only ended spans are processed by the exporter.
    // We want the exporter to know that a call has started
    const startCallSpan = tracer.startSpan(
      "otel_startCallSpan",
      undefined,
      this.callContext
    );
    startCallSpan.end();
  }
  public muteMic(muteState: boolean) {
    if (muteState) {
      this.muteSpan = tracer.startSpan(
        "otel_muteSpan",
        undefined,
        this.callContext
      );
    } else if (this.muteSpan) {
      this.muteSpan.end();
      this.muteSpan = null;
    }
  }
  public endCall() {
    this.callSpan?.end();
  }
}

export const callTracer = new CallTracer();
*/
