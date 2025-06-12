window.SECRET_PATTERNS = [
  {
    id: "AWS Access Key",
    regex: new RegExp("(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "g"),
    confidence: "high"
  },
  {
    id: "AWS Secret Key",
    regex: new RegExp("aws(.{0,20})?['\\\"][0-9a-zA-Z\\/+]{40}['\\\"]", "gi"),
    confidence: "high"
  },
  {
    id: "AWS MWS key",
    regex: new RegExp("amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "g"),
    confidence: "high"
  },
  {
    id: "Facebook Secret Key",
    regex: new RegExp("(facebook|fb)(.{0,20})?['\\\"][0-9a-f]{32}['\\\"]", "gi"),
    confidence: "high"
  },
  {
    id: "Facebook Client ID",
    regex: new RegExp("(facebook|fb)(.{0,20})?['\\\"][0-9]{13,17}['\\\"]", "gi"),
    confidence: "high"
  },
  {
    id: "Twitter Secret Key",
    regex: new RegExp("twitter(.{0,20})?[0-9a-z]{35,44}", "gi"),
    confidence: "high"
  },
  {
    id: "Twitter Client ID",
    regex: new RegExp("twitter(.{0,20})?[0-9a-z]{18,25}", "gi"),
    confidence: "high"
  },
  {
    id: "Github Personal Access Token",
    regex: new RegExp("ghp_[0-9a-zA-Z]{36}", "g"),
    confidence: "high"
  },
  {
    id: "Github OAuth Access Token",
    regex: new RegExp("gho_[0-9a-zA-Z]{36}", "g"),
    confidence: "high"
  },
  {
    id: "Github App Token",
    regex: new RegExp("(ghu|ghs)_[0-9a-zA-Z]{36}", "g"),
    confidence: "high"
  },
  {
    id: "Github Refresh Token",
    regex: new RegExp("ghr_[0-9a-zA-Z]{76}", "g"),
    confidence: "high"
  },
  {
    id: "LinkedIn Client ID",
    regex: new RegExp("linkedin(.{0,20})?[0-9a-z]{12}", "gi"),
    confidence: "high"
  },
  {
    id: "LinkedIn Secret Key",
    regex: new RegExp("linkedin(.{0,20})?[0-9a-z]{16}", "gi"),
    confidence: "high"
  },
  {
    id: "Slack",
    regex: new RegExp("xox[baprs]-([0-9a-zA-Z-]{10,72})?", "g"),
    confidence: "high"
  },
  {
    id: "Asymmetric Private Key",
    regex: new RegExp("-----BEGIN ((EC|PGP|DSA|RSA|OPENSSH) )?PRIVATE KEY( BLOCK)?-----", "g"),
    confidence: "high"
  },
  {
    id: "Google API key",
    regex: new RegExp("AIza[0-9A-Za-z\\\\-_]{35}", "g"),
    confidence: "high"
  },
  {
    id: "Google (GCP) Service Account",
    regex: new RegExp("\"type\": \"service_account\"", "g"),
    confidence: "high"
  },
  {
    id: "Heroku API key",
    regex: new RegExp("heroku(.{0,20})?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "gi"),
    confidence: "high"
  },
  {
    id: "MailChimp API key",
    regex: new RegExp("(mailchimp|mc)(.{0,20})?[0-9a-f]{32}-us[0-9]{1,2}", "gi"),
    confidence: "high"
  },
  {
    id: "Mailgun API key",
    regex: new RegExp("((mailgun|mg)(.{0,20})?)?key-[0-9a-z]{32}", "gi"),
    confidence: "high"
  },
  {
    id: "PayPal Braintree access token",
    regex: new RegExp("access_token\\$production\\$[0-9a-z]{16}\\$[0-9a-f]{32}", "g"),
    confidence: "high"
  },
  {
    id: "Picatic API key",
    regex: new RegExp("sk_live_[0-9a-z]{32}", "g"),
    confidence: "high"
  },
  {
    id: "SendGrid API Key",
    regex: new RegExp("SG\\.[\\w_]{16,32}\\.[\\w_]{16,64}", "g"),
    confidence: "high"
  },
  {
    id: "Slack Webhook",
    regex: new RegExp("https://hooks.slack.com/services/T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8,12}/[a-zA-Z0-9_]{24}", "g"),
    confidence: "high"
  },
  {
    id: "Stripe API key",
    regex: new RegExp("stripe(.{0,20})?[sr]k_live_[0-9a-zA-Z]{24}", "gi"),
    confidence: "high"
  },
  {
    id: "Square access token",
    regex: new RegExp("sq0atp-[0-9A-Za-z\\-_]{22}", "g"),
    confidence: "high"
  },
  {
    id: "Square OAuth secret",
    regex: new RegExp("sq0csp-[0-9A-Za-z\\\\-_]{43}", "g"),
    confidence: "high"
  },
  {
    id: "Twilio API key",
    regex: new RegExp("twilio(.{0,20})?SK[0-9a-f]{32}", "gi"),
    confidence: "high"
  },
  {
    id: "Dynatrace ttoken",
    regex: new RegExp("dt0[a-zA-Z]{1}[0-9]{2}\\.[A-Z0-9]{24}\\.[A-Z0-9]{64}", "g"),
    confidence: "high"
  },
  {
    id: "Shopify shared secret",
    regex: new RegExp("shpss_[a-fA-F0-9]{32}", "g"),
    confidence: "high"
  },
  {
    id: "Shopify access token",
    regex: new RegExp("shpat_[a-fA-F0-9]{32}", "g"),
    confidence: "high"
  },
  {
    id: "Shopify custom app access token",
    regex: new RegExp("shpca_[a-fA-F0-9]{32}", "g"),
    confidence: "high"
  },
  {
    id: "PyPI upload token",
    regex: new RegExp("pypi-AgEIcHlwaS5vcmc[A-Za-z0-9-_]{50,1000}", "g"),
    confidence: "high"
  },
  {
    id: "AWS cred file info",
    regex: new RegExp("(aws_access_key_id|aws_secret_access_key)(.{0,20})?=.[0-9a-zA-Z\\/+]{20,40}", "gi"),
    confidence: "high"
  },
  {
    id: "Github",
    regex: new RegExp("github(.{0,20})?['\\\"][0-9a-zA-Z]{35,40}['\\\"]", "gi"),
    confidence: "high"
  },
  {
    id: "EC",
    regex: new RegExp("-----BEGIN EC PRIVATE KEY-----", "g"),
    confidence: "high"
  },
  {
    id: "Env Var",
    regex: new RegExp("(apikey|secret|key|api|password|pass|pw|host)=[0-9a-zA-Z-_.{}]{4,120}", "gi"),
    confidence: "high"
  },
  {
    id: "Generic Credential",
    regex: new RegExp("(dbpasswd|dbuser|dbname|dbhost|api_key|apikey|secret|key|api|password|user|guid|hostname|pw|auth)(.{0,20})?['|\"]([0-9a-zA-Z-_\\/+!{}/=]{4,120})['|\"]", "gi"),
    confidence: "high"
  },
  {
    id: "WP-Config",
    regex: new RegExp("define(.{0,20})?(DB_CHARSET|NONCE_SALT|LOGGED_IN_SALT|AUTH_SALT|NONCE_KEY|DB_HOST|DB_PASSWORD|AUTH_KEY|SECURE_AUTH_KEY|LOGGED_IN_KEY|DB_NAME|DB_USER)(.{0,20})?['|\"].{10,120}['|\"]", "g"),
    confidence: "high"
  },
];
