<?php
/**
 * Shopware 5
 * Copyright (c) shopware AG
 *
 * According to our dual licensing model, this program can be used either
 * under the terms of the GNU Affero General Public License, version 3,
 * or under a proprietary license.
 *
 * The texts of the GNU Affero General Public License with an additional
 * permission and of our proprietary license can be found at and
 * in the LICENSE file you have received along with this program.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * "Shopware" is a registered trademark of shopware AG.
 * The licensing of the program under the AGPLv3 does not imply a
 * trademark license. Therefore any rights, title and interest in
 * our trademarks remain entirely with us.
 */

namespace Shopware\Recovery\Install;

use Shopware\Recovery\Install\Struct\DatabaseConnectionInformation;

/**
 * @category  Shopware
 * @package   Shopware\Recovery\Install
 * @copyright Copyright (c) shopware AG (http://www.shopware.de)
 */
class DatabaseFactory
{
    /**
     * @param  DatabaseConnectionInformation $info
     * @return \PDO
     * @throws \Exception
     * @throws \PDOException
     */
    public function createPDOConnection(DatabaseConnectionInformation $info)
    {
        $conn = new \PDO(
            $this->buildDsn($info),
            $info->username,
            $info->password,
            [
                \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
            ]
        );

        $this->setNonStrictSQLMode($conn);

        $this->checkVersion($conn);
        $this->checkEngineSupport($conn);
        $this->checkSQLMode($conn);

        return $conn;
    }

    /**
     * @param  DatabaseConnectionInformation $info
     * @return string
     */
    private function buildDsn(DatabaseConnectionInformation $info)
    {
        if (!empty($info->socket)) {
            $connectionString = 'unix_socket=' . $info->socket . ';';
        } else {
            $connectionString = 'host=' . $info->hostname . ';';
            if (!empty($info->port)) {
                $connectionString .= 'port=' . $info->port . ';';
            }
        }

        if ($info->databaseName) {
            $connectionString .= 'dbname=' . $info->databaseName . ';';
        }

        return 'mysql:' . $connectionString;
    }

    /**
     * Is given MySQL storage engine available?
     *
     * @param  string $engineName
     * @param  \PDO   $conn
     * @return bool
     */
    private function hasStorageEngine($engineName, \PDO $conn)
    {
        $sql = 'SHOW ENGINES;';
        $allEngines = $conn->query($sql)->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($allEngines as $engine) {
            if ($engine['Engine'] == $engineName) {
                $support = $engine['Support'];

                return $support == 'DEFAULT' || $support == 'YES';
            }
        }

        return false;
    }

    /**
     * @param  \PDO              $conn
     * @throws \RuntimeException
     */
    private function checkVersion(\PDO $conn)
    {
        $sql = "SELECT VERSION()";
        $result = $conn->query($sql)->fetchColumn(0);
        if (version_compare($result, '5.5.0', '<')) {
            throw new \RuntimeException(("Database error!: Your database server is running MySQL $result, but Shopware 5 requires at least MySQL 5.5"));
        }
    }

    /**
     * @param  \PDO              $conn
     * @throws \RuntimeException
     */
    private function checkEngineSupport(\PDO $conn)
    {
        $hasEngineSupport = $this->hasStorageEngine('InnoDB', $conn);
        if (!$hasEngineSupport) {
            throw new \RuntimeException("Database error!: The MySQL storage engine InnoDB not found. Please consult your hosting provider to solve this problem.");
        }
    }

    /**
     * @param  \PDO              $conn
     * @throws \RuntimeException
     */
    private function checkSQLMode(\PDO $conn)
    {
        $sql = "SELECT @@SESSION.sql_mode;";
        $result = $conn->query($sql)->fetchColumn(0);

        if (strpos($result, 'STRICT_TRANS_TABLES') !== false || strpos($result, 'STRICT_ALL_TABLES') !== false) {
            throw new \RuntimeException("Database error!: The MySQL strict mode is active ($result). Please consult your hosting provider to solve this problem.");
        }
    }

    /**
     * @param $conn
     */
    protected function setNonStrictSQLMode(\PDO $conn)
    {
        $conn->exec("SET @@session.sql_mode = ''");
    }
}