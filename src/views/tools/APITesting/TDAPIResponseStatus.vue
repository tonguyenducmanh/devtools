<template>
  <div>
    <div class="status-info" v-if="statusCode">
      <div class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
      <div class="response-time" v-if="responseTime">{{ responseTime }}ms</div>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDAPIResponseStatus",
  data() {
    return {};
  },
  props: {
    responseTime: {
      type: Number,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
  },
  computed: {
    statusClass() {
      if (!this.statusCode) return "";
      if (this.statusCode >= 200 && this.statusCode < 300) return "success";
      if (this.statusCode >= 300 && this.statusCode < 400) return "redirect";
      if (this.statusCode >= 400 && this.statusCode < 500)
        return "client-error";
      if (this.statusCode >= 500) return "server-error";
      return "";
    },
    statusText() {
      let code = Number(this.statusCode);
      if (!code) return "";
      // mapping chi tiết
      let exactMap = {
        200: "OK",
        201: "Created",
        202: "Accepted",
        204: "No Content",
        301: "Moved Permanently",
        302: "Found",
        304: "Not Modified",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        408: "Request Timeout",
        409: "Conflict",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
      };

      // ưu tiên exact
      if (exactMap[code]) {
        return `${code} ${exactMap[code]}`;
      }

      // fallback theo nhóm HTTP
      let group = Math.floor(code / 100);
      let groupMap = {
        1: "Informational",
        2: "Success",
        3: "Redirection",
        4: "Client Error",
        5: "Server Error",
      };

      return groupMap[group]
        ? `${code} ${groupMap[group]}`
        : `${code} Unknown Status`;
    },
  },
};
</script>

<style scoped lang="scss">
.status-info {
  display: flex;
  align-items: center;
  gap: var(--padding);
  background-color: var(--bg-secondary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 600;
  color: white;
}

.status-badge.success {
  background-color: #10b981;
}

.status-badge.redirect {
  background-color: #3b82f6;
}

.status-badge.client-error {
  background-color: #f59e0b;
}

.status-badge.server-error {
  background-color: #ef4444;
}

.response-time {
  color: var(--text-secondary);
}
</style>
