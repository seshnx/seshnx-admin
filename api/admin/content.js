import { verifyAdminAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import * as neonQueries from '../utils/neonQueries.js';
import { logAuditAction, extractAdminInfo, AuditActions } from '../utils/auditLogger.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authentication
    const authError = await verifyAdminAuth(req, res);
    if (authError) return authError;

    // GET: List content (posts, comments, flagged)
    if (req.method === 'GET') {
      const { type, limit, offset, userId, status, startDate, endDate } = req.query;

      try {
        let content;

        if (type === 'posts') {
          content = await neonQueries.getPosts({
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0,
            userId: userId || null,
            status: status || 'all',
            startDate: startDate || null,
            endDate: endDate || null
          });
        } else if (type === 'comments') {
          content = await neonQueries.getComments({
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0,
            postId: req.query.postId || null,
            status: status || 'all'
          });
        } else if (type === 'flagged') {
          content = await neonQueries.getFlaggedContent({
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
          });
        } else {
          return res.status(400).json({ error: 'Invalid type parameter. Use: posts, comments, or flagged' });
        }

        return res.status(200).json({ content });
      } catch (error) {
        console.error('Error fetching content:', error);
        return res.status(500).json({ error: 'Failed to fetch content' });
      }
    }

    // DELETE: Delete content
    if (req.method === 'DELETE') {
      const { postId, commentId } = req.body;

      if (!postId && !commentId) {
        return res.status(400).json({ error: 'Missing postId or commentId' });
      }

      try {
        let deletedContent;
        let auditAction;

        if (postId) {
          deletedContent = await neonQueries.deletePost(postId, req.admin.id);
          auditAction = AuditActions.POST_DELETED;
        } else if (commentId) {
          deletedContent = await neonQueries.deleteComment(commentId, req.admin.id);
          auditAction = AuditActions.COMMENT_DELETED;
        }

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          auditAction,
          { type: postId ? 'post' : 'comment', id: postId || commentId }
        );

        return res.status(200).json({
          success: true,
          content: deletedContent
        });
      } catch (error) {
        console.error('Error deleting content:', error);
        return res.status(500).json({ error: 'Failed to delete content' });
      }
    }

    // PUT: Approve flagged content
    if (req.method === 'PUT') {
      const { postId, commentId } = req.body;

      if (!postId && !commentId) {
        return res.status(400).json({ error: 'Missing postId or commentId' });
      }

      try {
        let approvedContent;
        let auditAction;

        if (postId) {
          approvedContent = await neonQueries.approveContent(postId, 'post');
          auditAction = AuditActions.POST_APPROVED;
        } else if (commentId) {
          approvedContent = await neonQueries.approveContent(commentId, 'comment');
          auditAction = AuditActions.COMMENT_APPROVED;
        }

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          auditAction,
          { type: postId ? 'post' : 'comment', id: postId || commentId }
        );

        return res.status(200).json({
          success: true,
          content: approvedContent
        });
      } catch (error) {
        console.error('Error approving content:', error);
        return res.status(500).json({ error: 'Failed to approve content' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
