const express = require("express");
const router = express.Router();
const { Message, Like } = require("../models");
const { authMiddleware } = require("./auth");
const Sequelize = require("sequelize");

// create message
/**
 * @swagger
 * /messages:
 *   post:
 *     security:
 *       - Bearer: []
 *     tags:
 *     - "message"
 *     summary: "Create a new message"
 *     description: "Create a new message"
 *     operationId: "createMessage"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "message details"
 *         required: true
 *         schema:
 *             $ref: "#/definitions/Message"
 *     responses:
 *       201:
 *         description: "Success, account saved"
 *       202:
 *         description: "Success, account saved"
 *       400:
 *         description: "Unable to save account"
 *       403:
 *         description: "The capability token provided does not grant access to the\
 *           \ requested\nfunctionality.\n"
 */
router.post("/", authMiddleware, (req, res) => {
  Message.create(
    Object.assign({}, req.body, {
      userId: req.user.get("id")
    })
  )
    .then(message => res.json({ message }))
    .catch(err => {
      if (err instanceof Sequelize.ValidationError) {
        return res.status(400).send({ errors: err.errors });
      }
      res.status(500).send();
    });
});

// read all messages
router.get("/", (req, res) => {
  Message.findAll({
    include: [
      {
        model: Like
      }
    ],
    limit: req.query.limit || 100,
    offset: req.query.offset || 0
  }).then(messages => res.json({ messages }));
});

// read message by id
router.get("/:id", (req, res) => {
  Message.findById(req.params.id, {
    include: [Like]
  }).then(message => res.json({ message }));
});

// update message by id
router.patch("/:id", authMiddleware, (req, res) => {
  Message.update(req.body, {
    where: {
      id: req.params.id
    }
  }).then(message => res.json({ message }));
});

// delete message
router.delete("/:id", authMiddleware, (req, res) => {
  Like.destroy({
    where: {
      messageId: req.params.id,
      userId: req.user.id
    }
  })
    .then(() =>
      Message.destroy({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      })
    )
    .then(destroyedCount => {
      if (destroyedCount === 0) {
        return res.status(400).send({ error: "Message does not exist" });
      }
      res.json({ id: req.params.id });
    });
});

module.exports = router;
