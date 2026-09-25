/** Demo fixtures the client can load without a network call. */

import manifest from "@/data/samples/manifest.json";

export const SAMPLE_IP = manifest.ip;
export const SAMPLE_HASH = manifest.hash;
export const SAMPLE_CVE = manifest.cve;

export const SAMPLE_HEADER = `Received: from mail.shipping-notice.example (10.1.2.3) by mx.contoso.example with ESMTPS;
From: "Payroll Desk" <payroll@contoso.example>
Return-Path: <bounce@shipping-notice.example>
Authentication-Results: mx.contoso.example;
  spf=fail smtp.mailfrom=shipping-notice.example;
  dkim=fail header.d=contoso.example;
  dmarc=fail header.from=contoso.example
Subject: Updated payment details
`;
