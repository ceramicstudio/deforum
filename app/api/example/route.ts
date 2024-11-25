import { NextRequest, NextResponse } from "next/server";
import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from "@ceramic-sdk/flight-sql-client";

const CONTAINER_OPTS = {
  containerName: "ceramic-test-flight",
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
};
const OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: "127.0.0.1",
  port: CONTAINER_OPTS.flightSqlPort,
};

async function getClient(): Promise<FlightSqlClient> {
  return createFlightSqlClient(OPTIONS);
}

export async function GET(request: NextRequest) {
  const client = await getClient();
  const buffer = await client.query("SELECT * FROM conclusion_events");
  console.log(buffer)
  return NextResponse.json({ message: "Hello from the API!" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ receivedData: body });
}
