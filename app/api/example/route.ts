export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server";
import { type ClientOptions, type FlightSqlClient, createFlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from 'apache-arrow';
import {createCID} from '@ceramic-sdk/identifiers';

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
  const table = tableFromIPC(buffer);
  
  const rows = table.toArray().map(row => ({
    index: row.index?.toString(),
    stream_cid: row.stream_cid ? createCID(row.stream_cid).toString() : null,
    stream_type: row.stream_type,
    controller: row.controller ? Buffer.from(row.controller).toString() : null,
    event_cid: row.event_cid ? createCID(row.event_cid).toString() : null,
    event_type: row.event_type,
    data: row.data ? JSON.parse(Buffer.from(row.data).toString()) : null,
    previous: row.previous?.length ? row.previous.map(createCID).toString() : null,
    dimensions: row.dimensions?.entries ? Object.fromEntries(
      row.dimensions.entries.map(entry => [
        Buffer.from(entry.key).toString(),
        entry.value ? createCID(entry.value).toString() : null
      ])
    ) : null
  }));

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
 const body = await request.json();
 return NextResponse.json({ receivedData: body });
}