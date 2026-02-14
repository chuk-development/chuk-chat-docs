---
title: User & Billing Endpoints
weight: 8
---


Endpoints for managing user account status, subscriptions, and billing through Stripe.

## User Status

```http
GET /v1/user/status
```

Returns the current user's subscription and credit status.

### Headers

```http
Authorization: Bearer {accessToken}
```

### Response

```json
{
  "has_subscription": true,
  "current_plan": "pro",
  "credits_remaining": 850,
  "subscription_status": "active",
  "free_messages_remaining": 0,
  "free_messages_total": 10
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `has_subscription` | boolean | Whether the user has an active subscription |
| `current_plan` | string | Current subscription plan identifier |
| `credits_remaining` | integer | Remaining message credits |
| `subscription_status` | string | Subscription status (e.g., `active`, `canceled`, `past_due`) |
| `free_messages_remaining` | integer | Remaining free messages |
| `free_messages_total` | integer | Total free messages allocated |

### Example

```dart
Future<Map<String, dynamic>> getUserStatus() async {
  final dio = Dio();
  final response = await dio.get(
    'https://api.chuk.chat/v1/user/status',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return response.data as Map<String, dynamic>;
}
```

---

## Delete Account

```http
DELETE /v1/user/delete-account
```

Permanently deletes the user's account, all associated data, and cancels any active subscriptions. This endpoint supports GDPR right-to-erasure requests.

### Headers

```http
Authorization: Bearer {accessToken}
```

{{< callout type="warning" >}}
This action is irreversible. All user data, conversation history, encryption keys, and subscription information will be permanently deleted. The user is automatically signed out on success.
{{< /callout >}}

### Client Integration

The account deletion UI is accessible from the "Danger Zone" section in `AccountSettingsPage`. A confirmation dialog requires the user to explicitly confirm before the request is sent.

```dart
// lib/pages/account_settings_page.dart
Future<void> _deleteAccount() async {
  final confirmed = await showConfirmationDialog(
    title: 'Delete Account',
    message: 'This will permanently delete your account and all data.',
  );
  if (!confirmed) return;

  final dio = Dio();
  await dio.delete(
    'https://api.chuk.chat/v1/user/delete-account',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );
  // Sign out on success
  await AuthService.signOut();
}
```

---

## Stripe: Create Checkout Session

```http
POST /v1/stripe/create-checkout-session
```

Creates a Stripe checkout session for starting a new subscription.

### Headers

```http
Authorization: Bearer {accessToken}
```

### Response

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/..."
}
```

### Example

```dart
Future<String> createCheckoutSession() async {
  final dio = Dio();
  final response = await dio.post(
    'https://api.chuk.chat/v1/stripe/create-checkout-session',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return response.data['checkout_url'] as String;
}
```

---

## Stripe: Create Portal Session

```http
POST /v1/stripe/create-portal-session
```

Creates a Stripe customer portal session for managing an existing subscription.

### Headers

```http
Authorization: Bearer {accessToken}
```

### Response

```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

### Example

```dart
Future<String> createPortalSession() async {
  final dio = Dio();
  final response = await dio.post(
    'https://api.chuk.chat/v1/stripe/create-portal-session',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );

  return response.data['portal_url'] as String;
}
```

---

## Stripe: Sync Subscription

```http
POST /v1/stripe/sync-subscription
```

Manually synchronizes the user's subscription state between Stripe and the backend. Use this when the subscription status appears out of date.

### Headers

```http
Authorization: Bearer {accessToken}
```

### Example

```dart
Future<void> syncSubscription() async {
  final dio = Dio();
  await dio.post(
    'https://api.chuk.chat/v1/stripe/sync-subscription',
    options: Options(
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    ),
  );
}
```
