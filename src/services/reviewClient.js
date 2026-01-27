import { apiRequest } from './apiRequest'

export const runReview = (workspaceId, mergeRequestId, payload) =>
  apiRequest.post(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/run/`,
    payload,
  )

export const listReviewRuns = (workspaceId, mergeRequestId) =>
  apiRequest.get(`/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/list/`)

export const getReviewRunDetail = (workspaceId, mergeRequestId, reviewRunId) =>
  apiRequest.get(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/${reviewRunId}/detail/`,
  )

export const listReviewComments = (workspaceId, mergeRequestId, reviewRunId, params) =>
  apiRequest.get(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/${reviewRunId}/comments/`,
    params,
  )

export const rerunReviewRun = (workspaceId, mergeRequestId, reviewRunId, payload) =>
  apiRequest.post(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/${reviewRunId}/rerun/`,
    payload,
  )

export const cancelReviewRun = (workspaceId, mergeRequestId, reviewRunId) =>
  apiRequest.post(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/${reviewRunId}/cancel/`,
  )

export const publishReviewRun = (workspaceId, mergeRequestId, reviewRunId) =>
  apiRequest.post(
    `/workspace/${workspaceId}/merge-requests/${mergeRequestId}/reviews/${reviewRunId}/publish/`,
  )
