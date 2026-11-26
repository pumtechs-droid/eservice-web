const SECRET_PROPERTY = "EMAIL_WEBHOOK_SECRET";
const MAX_HTML_LENGTH = 50000;
const MAX_SUBJECT_LENGTH = 200;
const IDEMPOTENCY_CACHE_SECONDS = 21600;

function doPost(event) {
  const payload = parsePayload(event);
  if (!payload) {
    return jsonResponse({ success: false, error: "invalid_request" });
  }

  const expectedSecret = PropertiesService.getScriptProperties().getProperty(
    SECRET_PROPERTY
  );
  if (
    !expectedSecret ||
    !constantTimeEquals(payload.secret, expectedSecret)
  ) {
    return jsonResponse({ success: false, error: "unauthorized" });
  }

  const email = validateEmail(payload);
  if (!email) {
    return jsonResponse({ success: false, error: "invalid_email_request" });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return jsonResponse({ success: false, error: "service_busy" });
  }

  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "sent:" + sha256(email.idempotencyKey);
    if (cache.get(cacheKey)) {
      return jsonResponse({ success: true, duplicate: true });
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({
        success: false,
        error: "daily_send_quota_exceeded",
      });
    }

    MailApp.sendEmail(email.to, email.subject, "Please view this email as HTML.", {
      htmlBody: email.html,
      name: "E-SERVICE HUB & DIGITAL CYBER",
    });

    cache.put(cacheKey, "sent", IDEMPOTENCY_CACHE_SECONDS);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Email dispatch failed.");
    return jsonResponse({ success: false, error: "delivery_failed" });
  } finally {
    lock.releaseLock();
  }
}

function parsePayload(event) {
  const raw = event && event.postData && event.postData.contents;
  if (!raw || raw.length > MAX_HTML_LENGTH + 5000) {
    return null;
  }

  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function validateEmail(payload) {
  if (
    typeof payload.to !== "string" ||
    payload.to.length > 320 ||
    !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(payload.to) ||
    typeof payload.subject !== "string" ||
    payload.subject.length < 1 ||
    payload.subject.length > MAX_SUBJECT_LENGTH ||
    /[\r\n]/.test(payload.subject) ||
    typeof payload.html !== "string" ||
    payload.html.length < 1 ||
    payload.html.length > MAX_HTML_LENGTH ||
    typeof payload.idempotencyKey !== "string" ||
    payload.idempotencyKey.length < 1 ||
    payload.idempotencyKey.length > 200
  ) {
    return null;
  }

  return {
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    idempotencyKey: payload.idempotencyKey,
  };
}

function constantTimeEquals(actual, expected) {
  if (typeof actual !== "string" || actual.length !== expected.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function sha256(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value
  );
  return digest
    .map(function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}
