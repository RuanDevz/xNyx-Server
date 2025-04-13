const { User } = require('.././models');

const isAdmin = async (req, res, next) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado!" });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ error: "Acesso negado! Apenas administradores podem realizar esta ação." });
        }


        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = isAdmin;
