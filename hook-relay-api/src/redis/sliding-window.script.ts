export const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local permissionId = ARGV[3]

-- Use Redis's clock so all workers use the same time source.
local serverTime = redis.call('TIME')
local nowMs =
  tonumber(serverTime[1]) * 1000 +
  math.floor(tonumber(serverTime[2]) / 1000)

-- Remove permissions outside the rolling window.
redis.call(
  'ZREMRANGEBYSCORE',
  key,
  '-inf',
  nowMs - windowMs
)

local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfterMs = math.max(
    1,
    tonumber(oldest[2]) + windowMs - nowMs
  )

  return {0, retryAfterMs}
end

-- Record this permission.
redis.call('ZADD', key, nowMs, permissionId)

-- Remove tracking data after the receiver becomes inactive.
redis.call('PEXPIRE', key, windowMs * 2)

return {1, 0}
`;