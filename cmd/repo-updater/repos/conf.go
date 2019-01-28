package repos

import (
	"time"

	"github.com/sourcegraph/sourcegraph/pkg/conf"
)

func GetUpdateInterval() time.Duration {
	if v := conf.Get().RepoListUpdateInterval; v == 0 { //  default to 1 minute
		return 1 * time.Minute
	} else {
		return time.Duration(v) * time.Minute
	}
}
